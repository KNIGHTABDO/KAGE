import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";
import { useBookmarks, useProgress, toggleBookmark, deleteProgress, clearAllProgress, clearAllBookmarks } from "@/lib/library";
import { useState } from "react";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — KAGE" },
      { name: "description", content: "Your saved manga and reading progress." },
      { property: "og:title", content: "Library — KAGE" },
      { property: "og:description", content: "Your saved manga and reading progress." },
    ],
  }),
  component: Library,
});

function Library() {
  const bookmarks = useBookmarks();
  const progress = useProgress();
  const [tab, setTab] = useState<"saved" | "reading">("saved");

  return (
    <SiteShell>
      <div className="px-margin-mobile md:px-margin-desktop py-8 md:py-16 w-full max-w-canvas mx-auto">
        <header className="mb-8 md:mb-12 flex flex-col gap-4">
          <h1 className="font-display-lg text-3xl sm:text-5xl md:text-display-lg text-on-surface">Library</h1>
          <p className="font-body-md text-body-md md:text-body-lg text-on-surface-variant max-w-2xl">
            Your saved titles and reading progress. Stored locally in your browser.
          </p>

          <section className="border-y border-surface-container-highest py-6 grid grid-cols-2 gap-6 mt-2">
            <div className="flex flex-col border-l-2 border-primary/20 pl-4">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">Saved</span>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-3xl md:text-5xl text-primary">{bookmarks.length}</span>
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Titles</span>
              </div>
            </div>
            <div className="flex flex-col border-l-2 border-surface-container-highest pl-4">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">In Progress</span>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-3xl md:text-5xl text-on-surface">{progress.length}</span>
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Active</span>
              </div>
            </div>
          </section>

          <div className="flex justify-between items-center border-b border-surface-container-highest w-full gap-4 mt-2">
            <div className="flex gap-2">
              {(["saved", "reading"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 font-label-md text-label-md uppercase tracking-widest transition-colors ${
                    tab === t ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t === "saved" ? "Saved" : "Continue Reading"}
                </button>
              ))}
            </div>

            {tab === "saved" && bookmarks.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all saved titles?")) {
                    clearAllBookmarks();
                  }
                }}
                className="px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 cursor-pointer flex items-center gap-1 transition-colors border border-transparent hover:border-red-500/20"
                title="Clear all saved titles"
              >
                <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                Clear All
              </button>
            )}

            {tab === "reading" && progress.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all reading progress?")) {
                    clearAllProgress();
                  }
                }}
                className="px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 cursor-pointer flex items-center gap-1 transition-colors border border-transparent hover:border-red-500/20"
                title="Clear all reading progress"
              >
                <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                Clear All
              </button>
            )}
          </div>
        </header>

        {tab === "saved" ? (
          bookmarks.length === 0 ? (
            <EmptyState
              icon="bookmark"
              title="No bookmarks yet"
              body="Tap the bookmark icon on a manga page to save it here."
            />
          ) : (
            <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
              {bookmarks.map((b) => (
                <Link key={b.id} to="/manga/$id" params={{ id: b.id }} className="group flex flex-col gap-3 relative">
                  <div className="relative w-full aspect-[2/3] overflow-hidden bg-surface-container-low border border-surface-container-highest rounded-sm">
                    <img
                      alt={b.title}
                      loading="lazy"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      src={b.coverUrl}
                    />
                    
                    {/* Delete X Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleBookmark({ id: b.id, title: b.title, coverUrl: b.coverUrl });
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer flex items-center justify-center border border-white/10 shadow z-20"
                      title="Remove from Saved"
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                    </button>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="font-label-md text-label-md text-on-surface line-clamp-2 leading-tight drop-shadow-md">{b.title}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </section>
          )
        ) : progress.length === 0 ? (
          <EmptyState
            icon="auto_stories"
            title="Nothing in progress"
            body="Start reading a chapter and it will appear here automatically."
          />
        ) : (
          <section className="flex flex-col gap-3">
            {progress.map((p) => {
              const pct = p.totalPages > 0 ? Math.round((p.page / p.totalPages) * 100) : 0;
              return (
                <Link
                  key={p.mangaId}
                  to="/read/$id"
                  params={{ id: p.chapterId }}
                  className="flex gap-4 p-3 rounded border border-surface-container-highest hover:border-primary transition-colors bg-surface-container-lowest group"
                >
                  <img alt={p.mangaTitle} loading="lazy" className="w-16 h-24 object-cover rounded shrink-0" src={p.coverUrl} />
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                    <h3 className="font-headline-md text-base md:text-headline-md text-on-surface truncate group-hover:text-primary transition-colors">
                      {p.mangaTitle}
                    </h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                      Chapter {p.chapterNumber ?? "?"} • Page {p.page}/{p.totalPages}
                    </p>
                    <div className="w-full h-[2px] bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteProgress(p.mangaId);
                      }}
                      className="p-2 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer flex items-center justify-center mr-1"
                      title="Remove Progress"
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary self-center">arrow_forward</span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </SiteShell>
  );
}

function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 md:py-24 gap-4 border border-dashed border-surface-container-highest rounded-lg">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-50">{icon}</span>
      <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">{body}</p>
      <Link to="/browse" className="mt-2 inline-flex bg-primary-container text-on-primary-container px-6 py-3 rounded font-label-md text-label-md uppercase tracking-widest hover:bg-primary transition-colors">
        Browse Catalog
      </Link>
    </div>
  );
}
