// Local persistent library (bookmarks + reading progress).
import { useEffect, useState } from "react";

const KEY_BOOKMARKS = "kage.bookmarks.v1";
const KEY_PROGRESS = "kage.progress.v1";

export interface BookmarkEntry {
  id: string;
  title: string;
  coverUrl: string;
  addedAt: number;
}

export interface ProgressEntry {
  mangaId: string;
  mangaTitle: string;
  coverUrl: string;
  chapterId: string;
  chapterNumber: string | null;
  page: number;
  totalPages: number;
  updatedAt: number;
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(`${key}:changed`));
}

export function getBookmarks(): BookmarkEntry[] {
  return read<BookmarkEntry>(KEY_BOOKMARKS).sort((a, b) => b.addedAt - a.addedAt);
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().some((b) => b.id === id);
}

export function toggleBookmark(entry: Omit<BookmarkEntry, "addedAt">): boolean {
  const list = getBookmarks();
  const exists = list.find((b) => b.id === entry.id);
  if (exists) {
    write(KEY_BOOKMARKS, list.filter((b) => b.id !== entry.id));
    return false;
  }
  write(KEY_BOOKMARKS, [{ ...entry, addedAt: Date.now() }, ...list]);
  return true;
}

export function getProgress(): ProgressEntry[] {
  return read<ProgressEntry>(KEY_PROGRESS).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProgressFor(mangaId: string): ProgressEntry | undefined {
  return getProgress().find((p) => p.mangaId === mangaId);
}

export function saveProgress(entry: Omit<ProgressEntry, "updatedAt">): void {
  const list = getProgress().filter((p) => p.mangaId !== entry.mangaId);
  write(KEY_PROGRESS, [{ ...entry, updatedAt: Date.now() }, ...list].slice(0, 50));
}

const KEY_CHAPTER_PROGRESS = "kage.chapter_progress.v1";

export interface ChapterProgressEntry {
  mangaId: string;
  chapterId: string;
  page: number;
  totalPages: number;
  updatedAt: number;
  completed: boolean;
}

export function getChapterProgress(mangaId: string): ChapterProgressEntry[] {
  return read<ChapterProgressEntry>(KEY_CHAPTER_PROGRESS).filter((c) => c?.mangaId === mangaId);
}

export function saveChapterProgress(
  mangaId: string,
  chapterId: string,
  page: number,
  totalPages: number,
  completed?: boolean
): void {
  const all = read<ChapterProgressEntry>(KEY_CHAPTER_PROGRESS);
  const filtered = all.filter((c) => !(c?.mangaId === mangaId && c?.chapterId === chapterId));
  const isCompleted = completed ?? (page >= totalPages && totalPages > 0);
  const entry: ChapterProgressEntry = {
    mangaId,
    chapterId,
    page,
    totalPages,
    updatedAt: Date.now(),
    completed: isCompleted,
  };
  write(KEY_CHAPTER_PROGRESS, [entry, ...filtered]);
}

export function markChapterRead(mangaId: string, chapterId: string, totalPages = 1): void {
  saveChapterProgress(mangaId, chapterId, totalPages, totalPages, true);
}

export function markChapterUnread(mangaId: string, chapterId: string): void {
  const all = read<ChapterProgressEntry>(KEY_CHAPTER_PROGRESS);
  const filtered = all.filter((c) => !(c?.mangaId === mangaId && c?.chapterId === chapterId));
  write(KEY_CHAPTER_PROGRESS, filtered);
}

export function markAllChaptersRead(mangaId: string, chapters: { id: string; pages: number }[]): void {
  const all = read<ChapterProgressEntry>(KEY_CHAPTER_PROGRESS);
  const ids = new Set(chapters.map((c) => c.id));
  const filtered = all.filter((c) => !(c?.mangaId === mangaId && ids.has(c?.chapterId)));
  
  const now = Date.now();
  const newEntries = chapters.map((c) => ({
    mangaId,
    chapterId: c.id,
    page: c.pages || 1,
    totalPages: c.pages || 1,
    updatedAt: now,
    completed: true,
  }));
  
  write(KEY_CHAPTER_PROGRESS, [...newEntries, ...filtered]);
}

export function markAllChaptersUnread(mangaId: string): void {
  const all = read<ChapterProgressEntry>(KEY_CHAPTER_PROGRESS);
  const filtered = all.filter((c) => c?.mangaId !== mangaId);
  write(KEY_CHAPTER_PROGRESS, filtered);
}

export function useChapterProgress(mangaId: string): Record<string, ChapterProgressEntry> {
  const [items, setItems] = useState<Record<string, ChapterProgressEntry>>({});
  
  useEffect(() => {
    const load = () => {
      const list = getChapterProgress(mangaId);
      const map: Record<string, ChapterProgressEntry> = {};
      list.forEach((c) => {
        if (c && c.chapterId) {
          map[c.chapterId] = c;
        }
      });
      setItems(map);
    };
    
    load();
    const onChange = () => load();
    window.addEventListener(`${KEY_CHAPTER_PROGRESS}:changed`, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(`${KEY_CHAPTER_PROGRESS}:changed`, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [mangaId]);
  
  return items;
}

export function useBookmarks(): BookmarkEntry[] {
  const [items, setItems] = useState<BookmarkEntry[]>([]);
  useEffect(() => {
    setItems(getBookmarks());
    const onChange = () => setItems(getBookmarks());
    window.addEventListener(`${KEY_BOOKMARKS}:changed`, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(`${KEY_BOOKMARKS}:changed`, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return items;
}

export function useProgress(): ProgressEntry[] {
  const [items, setItems] = useState<ProgressEntry[]>([]);
  useEffect(() => {
    setItems(getProgress());
    const onChange = () => setItems(getProgress());
    window.addEventListener(`${KEY_PROGRESS}:changed`, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(`${KEY_PROGRESS}:changed`, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return items;
}

export function deleteProgress(mangaId: string): void {
  const list = getProgress().filter((p) => p.mangaId !== mangaId);
  write(KEY_PROGRESS, list);
}

export function clearAllProgress(): void {
  write(KEY_PROGRESS, []);
}

export function clearAllBookmarks(): void {
  write(KEY_BOOKMARKS, []);
}

