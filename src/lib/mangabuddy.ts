// MangaBuddy-backed API client - completely replacing MangaDex.
// This preserves the exact same TypeScript models and exported function signatures,
// ensuring the rest of the application functions perfectly with zero modifications.

const API = "/api/public/mangabuddy";

export type LocalizedString = Record<string, string>;

export interface Relationship {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
}

export interface MangaAttributes {
  title: LocalizedString;
  altTitles: LocalizedString[];
  description: LocalizedString;
  status: string;
  year: number | null;
  contentRating: string;
  tags: Array<{
    id: string;
    attributes: { name: LocalizedString; group: string };
  }>;
  lastChapter: string | null;
  originalLanguage: string;
}

export interface Manga {
  id: string;
  type: "manga";
  attributes: MangaAttributes;
  relationships: Relationship[];
}

export interface ChapterAttributes {
  volume: string | null;
  chapter: string | null;
  title: string | null;
  translatedLanguage: string;
  pages: number;
  publishAt: string;
  readableAt: string;
  externalUrl: string | null;
}

export interface Chapter {
  id: string;
  type: "chapter";
  attributes: ChapterAttributes;
  relationships: Relationship[];
}

export interface AtHomeResponse {
  baseUrl: string;
  chapter: { hash: string; data: string[]; dataSaver: string[] };
}

export function pickLocalized(loc: LocalizedString | undefined, fallback = ""): string {
  if (!loc) return fallback;
  return loc.en ?? Object.values(loc)[0] ?? fallback;
}

export function getCoverFileName(m: Manga): string | null {
  const rel = m.relationships.find((r) => r.type === "cover_art");
  const file = (rel?.attributes as { fileName?: string } | undefined)?.fileName;
  return file ?? null;
}

export function coverUrl(mangaId: string, fileName: string | null, size: 256 | 512 | "original" = 512): string {
  if (!fileName) {
    return `https://placehold.co/400x600/131313/ffb4ab?text=No+Cover`;
  }
  const absoluteUrl = fileName.startsWith("http") ? fileName : (fileName.startsWith("//") ? `https:${fileName}` : `https://mangabuddy.com/${fileName}`);
  return `/api/public/mangabuddy/image-proxy?url=${encodeURIComponent(absoluteUrl)}`;
}

export function mangaTitle(m: Manga): string {
  return pickLocalized(m.attributes.title, "Untitled");
}

export function mangaDescription(m: Manga): string {
  return pickLocalized(m.attributes.description, "");
}

export function mangaAuthor(m: Manga): string {
  const rel = m.relationships.find((r) => r.type === "author");
  return ((rel?.attributes as { name?: string } | undefined)?.name) ?? "Unknown";
}

export function isHostedChapter(chapter: Chapter): boolean {
  // On MangaBuddy, 100% of chapters are hosted directly!
  return true;
}

// Global regex helper to parse HTML from the proxy
async function fetchHtml(path: string): Promise<string> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${API}${path}${separator}html=true`;
  const res = await fetch(url, { headers: { Accept: "text/html" } });
  if (!res.ok) throw new Error(`MangaBuddy proxy error ${res.status}: ${path}`);
  return res.text();
}

export async function listPopular(limit = 18): Promise<Manga[]> {
  try {
    const html = await fetchHtml("/home");
    const list: Manga[] = [];
    
    // Match trending carousel slides
    const trendingRegex = /<div class="trending-item[^"]*"><a\s+title="([^"]+)"\s+href="[^"]*?\/([^"/]+)"[\s\S]*?data-src="([^"]+)"/gi;
    let match;
    while ((match = trendingRegex.exec(html)) !== null && list.length < limit) {
      const title = match[1];
      const slug = match[2];
      const cover = match[3];
      
      list.push({
        id: slug,
        type: "manga",
        attributes: {
          title: { en: title },
          altTitles: [],
          description: { en: `Read ${title} online on KAGE.` },
          status: "Ongoing",
          year: null,
          contentRating: "safe",
          tags: [],
          lastChapter: null,
          originalLanguage: "en"
        },
        relationships: [
          { id: slug, type: "cover_art", attributes: { fileName: cover } }
        ]
      });
    }
    return list;
  } catch (err) {
    console.error("Failed to load popular manga list from MangaBuddy:", err);
    return [];
  }
}

export async function listLatest(limit = 18): Promise<Manga[]> {
  try {
    const html = await fetchHtml("/home");
    const list: Manga[] = [];
    
    // Extract rich pre-formatted JSON data from scripts
    const regex = /<script id="json-data" type="application\/json">\s*([\s\S]+?)\s*<\/script>/gi;
    let match;
    while ((match = regex.exec(html)) !== null && list.length < limit) {
      try {
        const item = JSON.parse(match[1].trim());
        if (item.slug) {
          list.push({
            id: item.slug,
            type: "manga",
            attributes: {
              title: { en: item.title || item.name || "Untitled" },
              altTitles: item.alt_name ? [{ en: item.alt_name }] : [],
              description: { en: item.summary ? item.summary.replace(/\+\s*$/, "") : "" },
              status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Ongoing",
              year: null,
              contentRating: "safe",
              tags: item.genres ? item.genres.map((g: any) => ({
                id: g.slug,
                attributes: { name: { en: g.name }, group: "genre" }
              })) : [],
              lastChapter: item.updated_at_text || null,
              originalLanguage: "en"
            },
            relationships: [
              { id: item.slug, type: "cover_art", attributes: { fileName: item.cover } },
              { id: "author-id", type: "author", attributes: { name: item.author_names?.join(", ") || "Unknown" } }
            ]
          });
        }
      } catch (e) {
        // Skip malformed entries
      }
    }
    return list;
  } catch (err) {
    console.error("Failed to load latest manga list from MangaBuddy:", err);
    return [];
  }
}

export async function searchManga(query: string, limit = 20): Promise<Manga[]> {
  if (!query.trim()) return [];
  try {
    const html = await fetchHtml(`/search?q=${encodeURIComponent(query)}`);
    const list: Manga[] = [];
    
    // Parse using flexible regex from book-item start to next book-item start or end
    const blockRegex = /<div class="book-item">([\s\S]*?)(?=<div class="book-item">|$)/gi;
    let match;
    while ((match = blockRegex.exec(html)) !== null && list.length < limit) {
      const block = match[1];
      
      const titleMatch = block.match(/<a title="([^"]+)" href="[^"]*?\/([^"/]+)"/i);
      if (titleMatch) {
        const title = titleMatch[1];
        const slug = titleMatch[2];
        
        const imgMatch = block.match(/data-src="([^"]+)"/i);
        const img = imgMatch ? imgMatch[1] : "";
        
        list.push({
          id: slug,
          type: "manga",
          attributes: {
            title: { en: title },
            altTitles: [],
            description: { en: `Read ${title} online on KAGE.` },
            status: "Ongoing",
            year: null,
            contentRating: "safe",
            tags: [],
            lastChapter: null,
            originalLanguage: "en"
          },
          relationships: [
            { id: slug, type: "cover_art", attributes: { fileName: img } }
          ]
        });
      }
    }
    return list;
  } catch (err) {
    console.error("Search failed on MangaBuddy:", err);
    return [];
  }
}

export async function getManga(id: string): Promise<Manga> {
  const html = await fetchHtml(`/${id}`);
  
  const titleMatch = html.match(/<div class="name box">.*?<h1>([^<]+)<\/h1>/is) || html.match(/<h1>([^<]+)<\/h1>/is);
  const title = titleMatch ? titleMatch[1].trim() : "Untitled";
  
  const coverMatch = html.match(/class="img-cover">.*?data-src="([^"]+)"/is) || html.match(/class="img-cover">.*?src="([^"]+)"/is);
  const cover = coverMatch ? coverMatch[1] : "";
  
  const authorMatch = html.match(/<strong>Authors\s*:\s*<\/strong>.*?<span>([^<]+)<\/span>/is);
  const author = authorMatch ? authorMatch[1].trim() : "Unknown";
  
  const statusMatch = html.match(/<strong>Status\s*:\s*<\/strong>.*?<span>([^<]+)<\/span>/is);
  const status = statusMatch ? statusMatch[1].trim() : "Ongoing";
  
  // Extract high-quality summary from meta tag description
  const metaDescMatch = html.match(/<meta name="description" content="([^"]+)"/i);
  let summary = metaDescMatch ? metaDescMatch[1].trim() : "";
  summary = summary.replace(/^Read\s+.*?\s+-\s+/i, ""); // Clean up scraper prefix if present
  if (summary.includes(".......")) {
    summary = `Read ${title} online for free directly inside KAGE's native reading interface.`;
  }

  // Parse genres
  const genres: any[] = [];
  const genreRegex = /<a href="\/genres\/([^"]+)"[^>]*>\s*([^<,\n]+)/gi;
  let gMatch;
  while ((gMatch = genreRegex.exec(html)) !== null) {
    const gSlug = gMatch[1];
    const gName = gMatch[2].trim();
    if (gName && !genres.some(g => g.id === gSlug)) {
      genres.push({
        id: gSlug,
        attributes: { name: { en: gName }, group: "genre" }
      });
    }
  }

  return {
    id,
    type: "manga",
    attributes: {
      title: { en: title },
      altTitles: [],
      description: { en: summary },
      status: status,
      year: null,
      contentRating: "safe",
      tags: genres,
      lastChapter: null,
      originalLanguage: "en"
    },
    relationships: [
      { id, type: "cover_art", attributes: { fileName: cover } },
      { id: "author-id", type: "author", attributes: { name: author } }
    ]
  };
}

export async function getChapters(mangaId: string, limit = 100, offset = 0): Promise<{ data: Chapter[]; total: number }> {
  try {
    const html = await fetchHtml(`/${mangaId}`);
    const chapters: Chapter[] = [];
    
    // Parse chapters from details list
    const chapRegex = /<li id="c-\d+">\s*<a href="[^"]*?\/([^"/]+)\/([^"/]+)" title="([^"]+)">[\s\S]*?<strong class="chapter-title">([^<]+)<\/strong>[\s\S]*?<time class="chapter-update">([^<]+)<\/time>/gi;
    let match;
    while ((match = chapRegex.exec(html)) !== null) {
      const chapterSlug = match[2];
      const chapterTitle = match[3];
      const chapterLabel = match[4];
      const updateTime = match[5];
      
      const chapterNum = chapterLabel.replace("Chapter ", "").trim();
      
      chapters.push({
        id: `${mangaId}/${chapterSlug}`,
        type: "chapter",
        attributes: {
          volume: null,
          chapter: chapterNum || "1",
          title: chapterTitle.replace(`${mangaId} - `, ""),
          translatedLanguage: "en",
          pages: 100, // mock value greater than 0 so KAGE reader loads it as hosted
          publishAt: updateTime,
          readableAt: updateTime,
          externalUrl: null // Set to null so KAGE opens it directly in our native reader!
        },
        relationships: [{ id: mangaId, type: "manga" }]
      });
    }
    
    return {
      data: chapters.slice(offset, offset + limit),
      total: chapters.length
    };
  } catch (err) {
    console.error("Failed to load chapters from MangaBuddy details page:", err);
    return { data: [], total: 0 };
  }
}

export async function getChapter(chapterId: string): Promise<Chapter> {
  const parts = chapterId.split("/");
  const mangaId = parts[0];
  const chapterSlug = parts[1];
  
  try {
    const feed = await getChapters(mangaId);
    const match = feed.data.find((c) => c.id === chapterId);
    if (match) return match;
  } catch (e) {
    // Fallback to dynamic parsing below if feed fetch fails
  }
  
  const chapterNum = chapterSlug.replace("chapter-", "");
  return {
    id: chapterId,
    type: "chapter",
    attributes: {
      volume: null,
      chapter: chapterNum,
      title: `Chapter ${chapterNum}`,
      translatedLanguage: "en",
      pages: 100,
      publishAt: new Date().toISOString(),
      readableAt: new Date().toISOString(),
      externalUrl: null
    },
    relationships: [{ id: mangaId, type: "manga" }]
  };
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/public/mangabuddy/${chapterId}`);
    if (!res.ok) throw new Error("Failed to load chapter pages");
    const data = await res.json() as { images?: string[]; error?: string };
    if (data.error) throw new Error(data.error);
    return (data.images ?? []).map(
      (img) => `/api/public/mangabuddy/image-proxy?url=${encodeURIComponent(img)}`
    );
  } catch (err) {
    console.error("Failed to fetch chapter pages from MangaBuddy:", err);
    return [];
  }
}
