import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/SiteShell";
import { MangaCard, MangaCardSkeleton } from "@/components/MangaCard";
import { coverUrl, getCoverFileName, listLatest, listPopular, mangaDescription, mangaTitle } from "@/lib/mangabuddy";
import { useProgress, deleteProgress } from "@/lib/library";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KAGE — Read Manga Online" },
      { name: "description", content: "Discover and read thousands of manga titles. No account required." },
      { property: "og:title", content: "KAGE — Read Manga Online" },
      { property: "og:description", content: "Discover and read thousands of manga titles. Powered by MangaBuddy." },
    ],
  }),
  component: Home,
});

function Home() {
  const popular = useQuery({ queryKey: ["popular"], queryFn: () => listPopular(18), staleTime: 5 * 60_000 });
  const latest = useQuery({ queryKey: ["latest"], queryFn: () => listLatest(12), staleTime: 60_000 });
  const progress = useProgress();

  const hero = popular.data?.[0];

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative w-full h-[70vh] min-h-[480px] md:h-[80vh] flex items-end px-margin-mobile md:px-margin-desktop pb-10 md:pb-16 overflow-hidden">
        {hero ? (
          <>
            <div className="absolute inset-0 z-0">
              <img
                alt={mangaTitle(hero)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-50 object-top"
                src={coverUrl(hero.id, getCoverFileName(hero), "original")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent z-10" />
            </div>
            <div className="relative z-20 w-full max-w-canvas mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high/80 border border-surface-container-highest rounded mb-4 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">Trending Now</span>
              </div>
              <h1 className="font-display-lg text-3xl sm:text-5xl md:text-display-lg text-on-surface max-w-3xl leading-tight mb-4 drop-shadow-2xl line-clamp-2">
                {mangaTitle(hero)}
              </h1>
              <p className="font-body-md text-body-md md:text-body-lg text-on-surface-variant max-w-2xl mb-6 opacity-90 line-clamp-3">
                {mangaDescription(hero) || "Dive into a trending series, hand-picked from the global community."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/manga/$id"
                  params={{ id: hero.id }}
                  className="bg-primary text-on-primary font-label-md text-label-md px-6 sm:px-8 py-3 sm:py-4 rounded hover:bg-primary-container hover:text-on-primary-container transition-all duration-300 uppercase tracking-widest"
                >
                  Open Title
                </Link>
                <Link
                  to="/browse"
                  className="bg-transparent border border-surface-variant text-on-surface font-label-md text-label-md px-6 sm:px-8 py-3 sm:py-4 rounded hover:border-primary hover:text-primary transition-all duration-300 uppercase tracking-widest flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">explore</span>
                  Browse
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-surface-container-low animate-pulse" />
        )}
      </section>

      <div className="max-w-canvas mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-16 space-y-16 md:space-y-24">
        {progress.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="font-headline-md text-xl md:text-headline-md text-on-surface">Continue Reading</h2>
              <Link to="/library" className="font-label-sm text-label-sm text-primary uppercase tracking-widest hover:text-primary-container transition-colors flex items-center gap-1">
                View All <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </Link>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 snap-x snap-mandatory">
              {progress.slice(0, 10).map((p) => {
                const pct = p.totalPages > 0 ? Math.round((p.page / p.totalPages) * 100) : 0;
                return (
                  <Link
                    key={p.mangaId}
                    to="/read/$id"
                    params={{ id: p.chapterId }}
                    className="snap-start flex-none w-52 sm:w-64 group"
                  >
                    <div className="relative aspect-[2/3] rounded overflow-hidden border border-surface-container-highest mb-3 group-hover:border-primary transition-colors">
                      <img
                        alt={p.mangaTitle}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={p.coverUrl}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      
                      {/* Delete X Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteProgress(p.mangaId);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer flex items-center justify-center border border-white/10 shadow z-20"
                        title="Remove from Continue Reading"
                      >
                        <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                      </button>

                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-label-sm text-on-surface-variant uppercase tracking-widest">
                          Ch. {p.chapterNumber ?? "?"} • {p.page}/{p.totalPages}
                        </p>
                      </div>
                    </div>
                    <h3 className="font-label-md text-label-md text-on-surface mb-2 truncate">{p.mangaTitle}</h3>
                    <div className="w-full h-[2px] bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-headline-md text-xl md:text-headline-md text-on-surface">Popular</h2>
            <Link to="/browse" className="font-label-sm text-label-sm text-primary uppercase tracking-widest hover:text-primary-container transition-colors flex items-center gap-1">
              All <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {popular.isLoading
              ? Array.from({ length: 12 }).map((_, i) => <MangaCardSkeleton key={i} />)
              : popular.data?.slice(0, 12).map((m) => <MangaCard key={m.id} manga={m} />)}
          </div>
          {popular.isError && (
            <p className="text-on-surface-variant text-center py-12">Could not load popular titles. Check your connection.</p>
          )}
        </section>

        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-headline-md text-xl md:text-headline-md text-on-surface">Recently Updated</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {latest.isLoading
              ? Array.from({ length: 12 }).map((_, i) => <MangaCardSkeleton key={i} />)
              : latest.data?.slice(0, 12).map((m) => <MangaCard key={m.id} manga={m} />)}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
