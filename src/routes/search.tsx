import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { coverUrl, getCoverFileName, mangaAuthor, mangaTitle, searchManga } from "@/lib/mangabuddy";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — KAGE" },
      { name: "description", content: "Search the catalog for titles, authors, and themes." },
    ],
  }),
  component: SearchPage,
});

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 350);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchManga(debounced, 24),
    enabled: debounced.trim().length > 1,
    staleTime: 60_000,
  });

  return (
    <SiteShell>
      <div className="px-margin-mobile md:px-margin-desktop py-8 md:py-16 w-full max-w-canvas mx-auto">
        <h1 className="font-display-lg text-3xl sm:text-5xl md:text-display-lg text-on-surface mb-6">Search</h1>

        <div className="flex items-center gap-3 border border-surface-container-highest rounded-lg bg-surface-container-lowest px-4 py-3 focus-within:border-primary transition-colors mb-8">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search by title…"
            className="flex-1 bg-transparent outline-none border-none text-on-surface placeholder:text-on-surface-variant text-base md:text-lg"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {debounced.trim().length <= 1 && (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-50 mb-3 block">search</span>
            <p>Type at least 2 characters to search.</p>
          </div>
        )}

        {(isLoading || isFetching) && debounced.trim().length > 1 && (
          <p className="text-on-surface-variant text-center py-8">Searching…</p>
        )}

        {data && data.length === 0 && !isLoading && (
          <p className="text-on-surface-variant text-center py-8">No results for "{debounced}".</p>
        )}

        {data && data.length > 0 && (
          <ul className="flex flex-col gap-2">
            {data.map((m) => {
              const cover = coverUrl(m.id, getCoverFileName(m), 256);
              return (
                <li key={m.id}>
                  <Link to="/manga/$id" params={{ id: m.id }} className="flex gap-4 p-3 rounded border border-transparent hover:border-surface-container-highest hover:bg-surface-container-lowest transition-all group">
                    <img alt={mangaTitle(m)} loading="lazy" referrerPolicy="no-referrer" className="w-14 h-20 md:w-16 md:h-24 object-cover rounded shrink-0" src={cover} />
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                      <h3 className="font-headline-md text-base md:text-lg text-on-surface truncate group-hover:text-primary transition-colors">
                        {mangaTitle(m)}
                      </h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest truncate">
                        {mangaAuthor(m)} • {m.attributes.year ?? "—"} • {m.attributes.status}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.attributes.tags.slice(0, 3).map((t) => (
                          <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
                            {(t.attributes.name.en) ?? Object.values(t.attributes.name)[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary self-center">arrow_forward</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SiteShell>
  );
}
