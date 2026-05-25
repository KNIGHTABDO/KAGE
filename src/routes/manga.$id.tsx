import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import {
  coverUrl,
  getChapters,
  getCoverFileName,
  getManga,
  isHostedChapter,
  mangaAuthor,
  mangaDescription,
  mangaTitle,
  pickLocalized,
} from "@/lib/mangabuddy";
import {
  isBookmarked,
  toggleBookmark,
  getProgressFor,
  useChapterProgress,
  markChapterRead,
  markChapterUnread,
  markAllChaptersRead,
  markAllChaptersUnread,
  type ProgressEntry,
} from "@/lib/library";

export const Route = createFileRoute("/manga/$id")({
  head: () => ({
    meta: [
      { title: "Manga — KAGE" },
      { name: "description", content: "Read manga on KAGE." },
      { property: "og:title", content: "Manga — KAGE" },
      { property: "og:description", content: "Read manga on KAGE." },
    ],
  }),
  component: MangaDetails,
});

function MangaDetails() {
  const { id } = Route.useParams();
  const mangaQ = useQuery({ queryKey: ["manga", id], queryFn: () => getManga(id), staleTime: 5 * 60_000 });
  const chaptersQ = useQuery({
    queryKey: ["chapters", id],
    queryFn: () => getChapters(id, 200, 0),
    staleTime: 60_000,
  });
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [bookmarked, setBookmarked] = useState(false);
  const [userProgress, setUserProgress] = useState<ProgressEntry | undefined>(undefined);
  const chapterProgress = useChapterProgress(id);

  useEffect(() => setBookmarked(isBookmarked(id)), [id]);

  useEffect(() => {
    setUserProgress(getProgressFor(id));
    const onChange = () => {
      setUserProgress(getProgressFor(id));
    };
    window.addEventListener("kage.progress.v1:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("kage.progress.v1:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [id]);

  useEffect(() => {
    if (mangaQ.data) document.title = `${mangaTitle(mangaQ.data)} — KAGE`;
  }, [mangaQ.data]);

  if (mangaQ.isLoading) {
    return (
      <SiteShell>
        <div className="p-margin-mobile md:p-margin-desktop animate-pulse space-y-6">
          <div className="h-64 bg-surface-container-low rounded" />
          <div className="h-8 w-2/3 bg-surface-container-low rounded" />
          <div className="h-4 w-full bg-surface-container-low rounded" />
        </div>
      </SiteShell>
    );
  }

  if (mangaQ.isError || !mangaQ.data) {
    return (
      <SiteShell>
        <div className="p-margin-mobile md:p-margin-desktop">
          <p className="text-on-surface-variant">Could not load this title.</p>
        </div>
      </SiteShell>
    );
  }

  const manga = mangaQ.data;
  const title = mangaTitle(manga);
  const cover = coverUrl(manga.id, getCoverFileName(manga), 512);
  const coverBig = coverUrl(manga.id, getCoverFileName(manga), "original");
  const author = mangaAuthor(manga);
  const description = mangaDescription(manga);
  const chapters = chaptersQ.data?.data ?? [];
  const sorted = order === "desc" ? chapters : [...chapters].reverse();
  const firstChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;
  const firstExternalChapter = null;

  const handleBookmark = () => {
    const now = toggleBookmark({ id: manga.id, title, coverUrl: cover });
    setBookmarked(now);
  };

  return (
    <SiteShell>
      <section className="relative w-full h-[60vh] min-h-[420px] md:h-[560px] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img alt={`${title} backdrop`} referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-40 object-top blur-sm scale-110" src={coverBig} />
          <div className="absolute inset-0 immersive-gradient z-10" />
        </div>
        <div className="relative z-20 w-full max-w-canvas mx-auto px-margin-mobile md:px-margin-desktop pb-8 md:pb-12 flex flex-col md:flex-row items-end gap-6 md:gap-8">
          <div className="w-32 md:w-48 aspect-[2/3] flex-shrink-0 rounded border border-surface-container-highest overflow-hidden shadow-2xl shadow-black/80">
            <img alt={`${title} cover`} referrerPolicy="no-referrer" className="w-full h-full object-cover" src={cover} />
          </div>
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-wrap gap-2 mb-1">
              {manga.attributes.tags.slice(0, 4).map((t) => (
                <span key={t.id} className="px-2 py-1 border border-surface-container-highest text-on-surface-variant font-label-sm text-label-sm uppercase tracking-widest rounded-sm">
                  {pickLocalized(t.attributes.name)}
                </span>
              ))}
            </div>
            <h1 className="font-display-lg text-2xl sm:text-4xl md:text-display-lg text-on-surface leading-tight">{title}</h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 font-body-md text-body-md text-on-surface-variant">
              <span>By <strong className="text-on-surface font-semibold">{author}</strong></span>
              <span className="hidden md:inline w-1 h-1 rounded-full bg-surface-container-highest" />
              <span className="capitalize">{manga.attributes.status}</span>
              {manga.attributes.year && (
                <>
                  <span className="hidden md:inline w-1 h-1 rounded-full bg-surface-container-highest" />
                  <span>{manga.attributes.year}</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 w-full">
              {userProgress ? (
                <>
                  <Link
                    to="/read/$id"
                    params={{ id: userProgress.chapterId }}
                    className="flex-grow md:flex-none bg-primary text-on-primary font-label-md text-label-md px-6 py-3 md:py-4 rounded uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-lg shadow-primary/10"
                  >
                    <span className="material-symbols-outlined">play_arrow</span> Resume Ch. {userProgress.chapterNumber || "?"} • Page {userProgress.page}
                  </Link>
                  {firstChapter && firstChapter.id !== userProgress.chapterId && (
                    <Link
                      to="/read/$id"
                      params={{ id: firstChapter.id }}
                      className="flex-1 md:flex-none border border-surface-container-highest text-on-surface font-label-md text-label-md px-6 py-3 md:py-4 rounded uppercase tracking-widest flex justify-center items-center gap-2 hover:border-primary hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">menu_book</span> First Chapter
                    </Link>
                  )}
                </>
              ) : firstChapter ? (
                <Link
                  to="/read/$id"
                  params={{ id: firstChapter.id }}
                  className="flex-1 md:flex-none bg-primary-container text-on-primary-container font-label-md text-label-md px-6 py-3 md:py-4 rounded uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-primary transition-colors"
                >
                  <span className="material-symbols-outlined">menu_book</span> Read First Ch.
                </Link>
              ) : null}
              <button
                onClick={handleBookmark}
                className={`p-3 md:p-4 border rounded flex items-center justify-center gap-2 transition-colors ${
                  bookmarked ? "border-primary text-primary bg-primary/10" : "border-surface-container-highest text-on-surface hover:border-primary hover:text-primary"
                }`}
                aria-label={bookmarked ? "Remove from library" : "Add to library"}
              >
                <span className="material-symbols-outlined" style={bookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {bookmarked ? "bookmark_added" : "bookmark_add"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-canvas mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-gutter">
        <div className="md:col-span-8 flex flex-col gap-6">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Synopsis</h2>
            <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-line leading-relaxed">
              {description || "No description available."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 border-b border-surface-container-highest pb-3 mt-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Chapters <span className="text-on-surface-variant text-base">({chapters.length})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-on-surface-variant font-label-sm text-[11px] md:text-label-sm uppercase tracking-widest">
              <div className="flex gap-3 border-r border-surface-container-highest pr-4">
                <button onClick={() => setOrder("desc")} className={order === "desc" ? "text-primary cursor-pointer" : "hover:text-primary transition-colors cursor-pointer"}>Latest</button>
                <button onClick={() => setOrder("asc")} className={order === "asc" ? "text-primary cursor-pointer" : "hover:text-primary transition-colors cursor-pointer"}>First</button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const chapterData = chapters.map((c) => ({ id: c.id, pages: c.attributes.pages || 1 }));
                    markAllChaptersRead(id, chapterData);
                  }}
                  className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">done_all</span> Mark All Read
                </button>
                <button
                  onClick={() => markAllChaptersUnread(id)}
                  className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">remove_done</span> Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {chaptersQ.isLoading && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-surface-container-lowest rounded animate-pulse" />
            ))}
            {!chaptersQ.isLoading && sorted.length === 0 && (
              <p className="text-on-surface-variant text-center py-8">No English chapters available.</p>
            )}
            {sorted.map((c) => {
              const ch = c.attributes.chapter ?? "—";
              const ctitle = c.attributes.title || `Chapter ${ch}`;
              const date = new Date(c.attributes.publishAt).toLocaleDateString();
              const group = (c.relationships.find((r) => r.type === "scanlation_group")?.attributes as { name?: string } | undefined)?.name;
              const isExternal = !!c.attributes.externalUrl;
              
              const progressEntry = chapterProgress[c.id];
              const isCompleted = progressEntry?.completed === true;
              const inProgress = progressEntry && !isCompleted;

              const content = (
                <div className="flex items-center gap-3 min-w-0">
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-emerald-500 text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ) : inProgress ? (
                    <span className="material-symbols-outlined text-amber-500 text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant text-xl shrink-0">{isExternal ? "open_in_new" : "menu_book"}</span>
                  )}
                  <div className="min-w-0">
                    <h3 className={`font-body-md text-body-md truncate transition-all ${isCompleted ? "text-on-surface/50 line-through decoration-on-surface/20" : "text-on-surface"}`}>
                      <span className="text-on-surface-variant mr-2">Ch. {ch}</span>
                      {ctitle}
                      {inProgress && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-label-sm text-[10px] uppercase tracking-wider font-semibold ml-2">
                          Page {progressEntry.page}/{progressEntry.totalPages}
                        </span>
                      )}
                    </h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
                      {date}{group ? ` • ${group}` : ""}
                    </p>
                  </div>
                </div>
              );

              return (
                <div key={c.id} className="flex justify-between items-center rounded border border-transparent hover:border-surface-container-highest hover:bg-surface-container-lowest transition-all group">
                  <Link to="/read/$id" params={{ id: c.id }} className="flex-1 flex justify-between items-center p-3 min-w-0">
                    {content}
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary shrink-0 ml-2">arrow_forward</span>
                  </Link>
                  
                  {/* Manual checkmark toggle */}
                  <button
                    onClick={() => {
                      if (isCompleted) {
                        markChapterUnread(id, c.id);
                      } else {
                        const totalPages = c.attributes.pages || 1;
                        markChapterRead(id, c.id, totalPages);
                      }
                    }}
                    className="p-3 mr-1 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                    title={isCompleted ? "Mark as unread" : "Mark as read"}
                    aria-label={isCompleted ? "Mark as unread" : "Mark as read"}
                  >
                    <span className="material-symbols-outlined text-xl" style={isCompleted ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      {isCompleted ? "check_box" : "check_box_outline_blank"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="md:col-span-4 flex flex-col gap-6">
          <div className="p-4 md:p-6 glass-panel rounded-lg flex flex-col gap-4 md:sticky md:top-6">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Details</h3>
            <dl className="flex flex-col gap-2 font-body-md text-body-md">
              <Row k="Status" v={<span className="capitalize text-on-surface">{manga.attributes.status}</span>} />
              <Row k="Year" v={<span className="text-on-surface">{manga.attributes.year ?? "—"}</span>} />
              <Row k="Language" v={<span className="uppercase text-on-surface">{manga.attributes.originalLanguage}</span>} />
              <Row k="Rating" v={<span className="capitalize text-on-surface">{manga.attributes.contentRating}</span>} />
            </dl>
            <div>
              <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {manga.attributes.tags.map((t) => (
                  <span key={t.id} className="text-xs px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
                    {pickLocalized(t.attributes.name)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </section>
    </SiteShell>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-surface-container-highest/50 pb-2">
      <dt className="text-on-surface-variant">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
