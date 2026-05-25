import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { MangaCard, MangaCardSkeleton } from "@/components/MangaCard";
import { listLatest, listPopular } from "@/lib/mangabuddy";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse — KAGE" },
      { name: "description", content: "Browse popular and recently updated manga from open catalogs." },
      { property: "og:title", content: "Browse — KAGE" },
      { property: "og:description", content: "Browse popular and recently updated manga." },
    ],
  }),
  component: Browse,
});

function Browse() {
  const [tab, setTab] = useState<"popular" | "latest">("popular");
  const popular = useQuery({ queryKey: ["browse-popular"], queryFn: () => listPopular(30), staleTime: 5 * 60_000 });
  const latest = useQuery({ queryKey: ["browse-latest"], queryFn: () => listLatest(30), staleTime: 60_000 });
  const active = tab === "popular" ? popular : latest;

  return (
    <SiteShell>
      <div className="px-margin-mobile md:px-margin-desktop py-8 md:py-16 w-full max-w-canvas mx-auto">
        <header className="mb-8 md:mb-12 flex flex-col gap-4">
          <h1 className="font-display-lg text-3xl sm:text-5xl md:text-display-lg text-on-surface">Browse</h1>
          <p className="font-body-md text-body-md md:text-body-lg text-on-surface-variant max-w-2xl">
            Discover trending and recently updated series from open manga catalogs.
          </p>
          <div className="flex gap-2 border-b border-surface-container-highest w-max">
            {(["popular", "latest"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 font-label-md text-label-md uppercase tracking-widest transition-colors ${
                  tab === t ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {t === "popular" ? "Popular" : "Recently Updated"}
              </button>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {active.isLoading
            ? Array.from({ length: 18 }).map((_, i) => <MangaCardSkeleton key={i} />)
            : active.data?.map((m) => <MangaCard key={m.id} manga={m} />)}
        </section>
        {active.isError && (
          <p className="text-on-surface-variant text-center py-12">Could not load titles. Check your connection.</p>
        )}
      </div>
    </SiteShell>
  );
}
