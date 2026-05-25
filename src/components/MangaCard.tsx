import { Link } from "@tanstack/react-router";
import { coverUrl, getCoverFileName, mangaTitle, type Manga } from "@/lib/mangabuddy";

interface Props {
  manga: Manga;
  size?: "sm" | "md";
}

export function MangaCard({ manga, size = "md" }: Props) {
  const title = mangaTitle(manga);
  const cover = coverUrl(manga.id, getCoverFileName(manga), 512);
  const year = manga.attributes.year;
  const status = manga.attributes.status;

  return (
    <Link
      to="/manga/$id"
      params={{ id: manga.id }}
      className="group flex flex-col gap-3"
    >
      <div className={`relative w-full aspect-[2/3] overflow-hidden bg-surface-container-low border border-surface-container-highest rounded-sm ${size === "sm" ? "" : ""}`}>
        <img
          alt={`${title} cover`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
          src={cover}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "https://placehold.co/400x600/131313/ffb4ab?text=No+Cover";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="font-label-md text-label-md text-on-surface line-clamp-2 leading-tight drop-shadow-md">
            {title}
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center px-0.5">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest truncate">
          {year ?? "—"}
        </span>
        <span className="font-label-sm text-label-sm text-primary/80 uppercase tracking-widest truncate">
          {status}
        </span>
      </div>
    </Link>
  );
}

export function MangaCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="w-full aspect-[2/3] bg-surface-container-low border border-surface-container-highest animate-pulse rounded-sm" />
      <div className="h-3 w-2/3 bg-surface-container-highest animate-pulse rounded" />
    </div>
  );
}
