import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  coverUrl,
  getChapter,
  getChapterPages,
  getChapters,
  getCoverFileName,
  getManga,
  isHostedChapter,
  mangaTitle,
} from "@/lib/mangabuddy";
import { saveProgress, saveChapterProgress } from "@/lib/library";

export const Route = createFileRoute("/read/$id")({
  head: () => ({
    meta: [
      { title: "Reader — KAGE" },
      { name: "description", content: "Immersive manga reader." },
    ],
  }),
  component: Reader,
});

function Reader() {
  const { id: chapterId } = Route.useParams();
  const navigate = useNavigate();

  const chapterQ = useQuery({ queryKey: ["chapter", chapterId], queryFn: () => getChapter(chapterId), staleTime: 60_000 });
  const isExternalChapter = !!chapterQ.data?.attributes.externalUrl;
  const officialUrl = chapterQ.data?.attributes.externalUrl ?? null;
  const pagesQ = useQuery({
    queryKey: ["pages", chapterId],
    queryFn: () => getChapterPages(chapterId),
    enabled: chapterQ.isSuccess,
    staleTime: 5 * 60_000,
  });

  const mangaId = useMemo(() => {
    return chapterQ.data?.relationships.find((r) => r.type === "manga")?.id;
  }, [chapterQ.data]);

  const mangaQ = useQuery({
    queryKey: ["manga", mangaId],
    queryFn: () => getManga(mangaId!),
    enabled: !!mangaId,
    staleTime: 5 * 60_000,
  });

  const siblingsQ = useQuery({
    queryKey: ["chapters", mangaId, "siblings"],
    queryFn: () => getChapters(mangaId!, 500, 0),
    enabled: !!mangaId,
    staleTime: 5 * 60_000,
  });

  const [hudVisible, setHudVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [readerWidth, setReaderWidth] = useState<number>(680);
  const [isHoveringHud, setIsHoveringHud] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Expanded Premium States
  const [readingMode, setReadingMode] = useState<"scroll" | "single">("scroll");
  const [theme, setTheme] = useState<"amoled" | "charcoal" | "sepia">("amoled");
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(2);

  useEffect(() => {
    const savedWidth = localStorage.getItem("kage.reader.width-px");
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= 320 && parsed <= 1200) {
        setReaderWidth(parsed);
      }
    }

    // Onboarding Hint check
    const seenHint = localStorage.getItem("reader-book-hint");
    if (!seenHint) {
      setShowHint(true);
    }

    // Reading Mode check
    const savedMode = localStorage.getItem("kage.reader.mode");
    if (savedMode === "scroll" || savedMode === "single") {
      setReadingMode(savedMode as "scroll" | "single");
    }

    // Theme check
    const savedTheme = localStorage.getItem("kage.reader.theme");
    if (savedTheme === "amoled" || savedTheme === "charcoal" || savedTheme === "sepia") {
      setTheme(savedTheme as "amoled" | "charcoal" | "sepia");
    }
  }, []);

  const handleWidthChange = (val: number) => {
    setReaderWidth(val);
    localStorage.setItem("kage.reader.width-px", String(val));
  };

  const handleToggleMenu = () => {
    // Save onboarding state on first click
    localStorage.setItem("reader-book-hint", "true");
    setShowHint(false);
    setMenuOpen((prev) => !prev);
  };

  const handleModeChange = (mode: "scroll" | "single") => {
    setReadingMode(mode);
    localStorage.setItem("kage.reader.mode", mode);
    setAutoScrollActive(false); // Pause scroll on mode change
  };

  const handleThemeChange = (t: "amoled" | "charcoal" | "sepia") => {
    setTheme(t);
    localStorage.setItem("kage.reader.theme", t);
  };

  // Reset scroll position on chapter change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
    setCurrentPage(1);
  }, [chapterId]);

  // Automatic HUD auto-hide after 5 seconds of mouse inactivity (unless hovering controls or onboarding is active)
  useEffect(() => {
    if (isHoveringHud || menuOpen || showHint || autoScrollActive) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setHudVisible(false);
      }, 5000);
    };

    const handleMouseMove = () => {
      setHudVisible(true);
      resetTimer();
    };

    window.addEventListener("mousemove", handleMouseMove);
    resetTimer();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [isHoveringHud, menuOpen, showHint, autoScrollActive]);

  const pages = pagesQ.data ?? [];
  const totalPages = pages.length;
  const chNum = chapterQ.data?.attributes.chapter ?? null;
  const chTitle = chapterQ.data?.attributes.title || (chNum ? `Chapter ${chNum}` : "Chapter");
  const title = mangaQ.data ? mangaTitle(mangaQ.data) : "Loading…";

  // 1. Webtoon Auto-Scroll Loop
  useEffect(() => {
    if (!autoScrollActive || readingMode !== "scroll") return;

    let frameId: number;
    const scroll = () => {
      window.scrollBy(0, autoScrollSpeed * 0.7);
      frameId = requestAnimationFrame(scroll);
    };
    frameId = requestAnimationFrame(scroll);

    const pause = () => setAutoScrollActive(false);

    // Pause on manual scrolls (wheel or touch drags)
    window.addEventListener("wheel", pause);
    window.addEventListener("touchmove", pause);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("wheel", pause);
      window.removeEventListener("touchmove", pause);
    };
  }, [autoScrollActive, autoScrollSpeed, readingMode]);

  // Page-by-page Flipping Helpers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (next) navigate({ to: "/read/$id", params: { id: next.id } });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (prev) navigate({ to: "/read/$id", params: { id: prev.id } });
    }
  };

  // Save progress
  useEffect(() => {
    if (!mangaQ.data || !chapterId || totalPages === 0) return;
    const t = setTimeout(() => {
      const isCompleted = currentPage === totalPages;
      saveProgress({
        mangaId: mangaQ.data!.id,
        mangaTitle: title,
        coverUrl: coverUrl(mangaQ.data!.id, getCoverFileName(mangaQ.data!), 512),
        chapterId,
        chapterNumber: chNum,
        page: currentPage,
        totalPages,
      });
      saveChapterProgress(
        mangaQ.data!.id,
        chapterId,
        currentPage,
        totalPages,
        isCompleted
      );
    }, 400);
    return () => clearTimeout(t);
  }, [currentPage, totalPages, mangaQ.data, chapterId, title, chNum]);

  // Track scroll position on the window for page tracking (only in scroll mode)
  useEffect(() => {
    if (totalPages === 0 || readingMode !== "scroll") return;
    const onScroll = () => {
      const els = document.querySelectorAll<HTMLElement>("[data-page]");
      let visible = 1;
      const mid = window.innerHeight / 2;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) visible = Number(el.dataset.page);
      });
      setCurrentPage(visible);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [totalPages, readingMode]);

  // Siblings nav (MangaBuddy lists newest first, so we copy and reverse it to represent ascending chronological order)
  const siblings = useMemo(() => {
    const list = siblingsQ.data?.data ?? [];
    return [...list].reverse();
  }, [siblingsQ.data]);
  const idx = siblings.findIndex((c) => c.id === chapterId);
  const prev = idx > 0 ? siblings.slice(0, idx).reverse().find(isHostedChapter) : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings.slice(idx + 1).find(isHostedChapter) : null;

  // Keybind navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mangaId) navigate({ to: "/manga/$id", params: { id: mangaId } });
      if (e.key === "h") setHudVisible((v) => !v);
      if (readingMode === "single") {
        if (e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault();
          goToNextPage();
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goToPrevPage();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navigate, mangaId, readingMode, currentPage, totalPages, next, prev]);

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  // Theme Tailwind style mapping
  const themeClasses = {
    amoled: "bg-black text-[#e5e2e1]",
    charcoal: "bg-[#141414] text-[#e5e2e1]",
    sepia: "bg-[#f4eedb] text-[#2d2319]",
  };

  const cardThemeClasses = {
    amoled: "bg-surface/95 border-surface-container-highest text-on-surface",
    charcoal: "bg-[#201f1f]/95 border-surface-container-highest text-on-surface",
    sepia: "bg-[#eadfca]/95 border-[#cbbeaa] text-[#2d2319]",
  };

  const inputBgClasses = {
    amoled: "bg-surface-container-low border-surface-container-highest",
    charcoal: "bg-[#181818] border-surface-container-highest",
    sepia: "bg-[#dfd4c0] border-[#c0b39e]",
  };

  const accentTextClasses = {
    amoled: "text-on-surface-variant",
    charcoal: "text-on-surface-variant",
    sepia: "text-[#5c4a37]",
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-300 ${themeClasses[theme]}`}>
      {/* Premium Keyframes for HUD & Onboarding */}
      <style>{`
        @keyframes reader-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes reader-wiggle {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes reader-pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        .animate-reader-float {
          animation: reader-float 3s ease-in-out infinite;
        }
        .animate-reader-wiggle {
          animation: reader-wiggle 1.2s ease-in-out infinite;
          display: inline-block;
        }
        .animate-reader-pulse-ring {
          animation: reader-pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
      `}</style>

      {/* 100% Full-Screen, Block-Free Manga Canvas */}
      <main
        className="w-full min-h-screen flex flex-col items-center pt-4 pb-28 gap-4"
        onClick={() => {
          setHudVisible((v) => !v);
          setMenuOpen(false); // Close panel on manga body click
        }}
      >
        {(chapterQ.isLoading || pagesQ.isLoading) && !isExternalChapter && (
          <div className="flex flex-col items-center gap-4 py-32">
            <span className="material-symbols-outlined text-primary text-5xl animate-pulse">auto_stories</span>
            <p className="text-on-surface-variant">Loading pages…</p>
          </div>
        )}
        {isExternalChapter && officialUrl && pagesQ.isSuccess && pages.length === 0 && (
          <div className="w-full max-w-xl mx-auto text-center py-28 px-6 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-primary text-5xl">open_in_new</span>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Official publisher chapter</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                MangaDex links this chapter to the publisher instead of hosting readable page images here.
              </p>
            </div>
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 bg-primary-container text-on-primary-container px-6 py-3 rounded font-label-md text-label-md uppercase tracking-widest hover:bg-primary transition-colors"
            >
              Open Official Chapter
              <span className="material-symbols-outlined">arrow_outward</span>
            </a>
          </div>
        )}
        {pagesQ.isError && !isExternalChapter && (
          <div className="text-center py-32 px-6">
            <p className="text-on-surface-variant mb-4">Could not load this chapter.</p>
            <button onClick={() => pagesQ.refetch()} className="px-4 py-2 border border-surface-container-highest rounded hover:border-primary hover:text-primary transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* 2. Reading Canvas Rendering Modes */}
        {pagesQ.isSuccess && !isExternalChapter && (
          readingMode === "single" ? (
            /* Single Page-by-Page Mode */
            <div 
              className="flex-grow w-full flex items-center justify-center relative min-h-[75vh] px-4 py-6"
              onClick={(e) => {
                e.stopPropagation(); // prevent main toggle HUD
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x < rect.width * 0.35) {
                  goToPrevPage();
                } else if (x > rect.width * 0.65) {
                  goToNextPage();
                } else {
                  setHudVisible((v) => !v);
                  setMenuOpen(false);
                }
              }}
            >
              {pages.length > 0 && (
                <div 
                  className="w-full transition-all duration-300 mx-auto flex items-center justify-center" 
                  style={{ maxWidth: `${readerWidth}px` }}
                >
                  <img
                    alt={`Page ${currentPage}`}
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-[82vh] md:max-h-[86vh] object-contain shadow-2xl rounded-sm select-none"
                    src={pages[currentPage - 1]}
                  />
                </div>
              )}
              
              {/* Overlay side indicators */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-50 transition-opacity bg-black/40 hover:bg-black/60 w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer select-none pointer-events-none">
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-50 transition-opacity bg-black/40 hover:bg-black/60 w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer select-none pointer-events-none">
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </div>
            </div>
          ) : (
            /* Continuous Webtoon Scroll Mode */
            <>
              {pages.map((src, i) => (
                <div key={src} data-page={i + 1} className="w-full px-2 md:px-0 transition-all duration-300 mx-auto" style={{ maxWidth: `${readerWidth}px` }}>
                  <img
                    alt={`Page ${i + 1}`}
                    loading={i < 2 ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                    className="max-w-full h-auto object-contain block mx-auto"
                    src={src}
                  />
                </div>
              ))}
            </>
          )
        )}

        {/* Scroll-end Next/Prev navigation buttons inside main flow */}
        {pages.length > 0 && (
          <div className="w-full max-w-2xl px-6 mt-12 flex flex-col sm:flex-row gap-3 items-stretch">
            {prev ? (
              <Link to="/read/$id" params={{ id: prev.id }} className={`flex-1 py-4 px-4 border rounded text-center hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 ${theme === "sepia" ? "border-[#cbbeaa]" : "border-surface-container-highest"}`}>
                <span className="material-symbols-outlined">skip_previous</span>
                Ch. {prev.attributes.chapter ?? "?"}
              </Link>
            ) : <div className="flex-1" />}
            {mangaId && (
              <Link to="/manga/$id" params={{ id: mangaId }} className="flex-1 py-4 px-4 bg-primary-container text-on-primary-container rounded text-center font-label-md uppercase tracking-widest hover:bg-primary transition-colors">
                All Chapters
              </Link>
            )}
            {next ? (
              <Link to="/read/$id" params={{ id: next.id }} className="flex-1 py-4 px-4 border border-primary text-primary rounded text-center hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center gap-2">
                Ch. {next.attributes.chapter ?? "?"}
                <span className="material-symbols-outlined">skip_next</span>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        )}
      </main>

      {/* Dynamic Floating Control Wheel Center (FAB & Onboarding Popover!) */}
      <div
        className={`fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3 transition-all duration-300 ${
          hudVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none invisible"
        }`}
      >
        {/* Onboarding Assistant Hint Card (Custom Gold Dashed design!) */}
        {showHint && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-20 w-[280px] sm:w-[320px] rounded-[28px] border border-yellow-400/40 bg-black/85 backdrop-blur-2xl p-6 shadow-2xl animate-reader-float pointer-events-auto select-none"
          >
            {/* Dashed Gold Border */}
            <div className="absolute inset-0 rounded-[28px] border border-dashed border-yellow-400/40 pointer-events-none" />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="animate-reader-wiggle text-3xl">👋</span>
                <h3 className="text-yellow-400 font-black text-2xl tracking-tight uppercase">
                  CLICK ME!
                </h3>
              </div>

              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                Open book mode to edit, customize, and enjoy your reading experience.
              </p>
            </div>

            {/* Hand-drawn style animated Vector Arrow */}
            <svg
              className="absolute -right-[75px] bottom-1 hidden sm:block pointer-events-none"
              width="90"
              height="60"
              viewBox="0 0 90 60"
              fill="none"
            >
              <path
                d="M5 10 C 50 -10, 60 40, 80 35"
                stroke="#facc15"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
              <path
                d="M68 28 L80 35 L70 42"
                stroke="#facc15"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Floating Settings Card Panel */}
        {menuOpen && (
          <div
            onMouseEnter={() => setIsHoveringHud(true)}
            onMouseLeave={() => setIsHoveringHud(false)}
            onClick={(e) => e.stopPropagation()} // prevent closing panel on card click
            className={`w-72 sm:w-80 border rounded-xl p-4 shadow-2xl flex flex-col gap-4 transition-all duration-300 pointer-events-auto max-h-[70vh] overflow-hidden ${cardThemeClasses[theme]}`}
          >
            {/* Manga Info */}
            <div className="flex flex-col gap-1 border-b border-surface-container-highest/20 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                {mangaId && (
                  <Link
                    to="/manga/$id"
                    params={{ id: mangaId }}
                    className={`p-1.5 hover:bg-surface-container-high/40 rounded transition-colors flex items-center justify-center cursor-pointer ${theme === "sepia" ? "text-amber-800" : "text-primary"}`}
                    title="Back to manga page"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </Link>
                )}
                <h3 className="font-headline-md text-sm truncate flex-1">{title}</h3>
              </div>
              <p className={`font-label-sm text-[10px] uppercase tracking-widest pl-7 ${accentTextClasses[theme]}`}>
                Ch. {chNum ?? "—"} • {chTitle}
              </p>
            </div>

            {/* Scrollable middle container */}
            <div className="flex-grow overflow-y-auto no-scrollbar flex flex-col gap-4 pr-1">
              {/* 3. Theme Selector */}
              <div className="flex flex-col gap-1.5">
                <span className={`font-label-sm text-[10px] uppercase tracking-widest ${accentTextClasses[theme]}`}>Background Theme</span>
                <div className="flex justify-between gap-2">
                  {(["amoled", "charcoal", "sepia"] as const).map((t) => {
                    const names = { amoled: "Amoled", charcoal: "Charcoal", sepia: "Sepia" };
                    const bgs = { amoled: "bg-black border-white/20", charcoal: "bg-[#161616] border-white/20", sepia: "bg-[#f4eedb] border-amber-800/20" };
                    const activeBorder = theme === t ? (theme === "sepia" ? "ring-2 ring-amber-800" : "ring-2 ring-primary") : "";
                    const textStyles = t === "sepia" ? "text-amber-950 font-bold" : "text-[#e5e2e1]";
                    return (
                      <button
                        key={t}
                        onClick={() => handleThemeChange(t)}
                        className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${bgs[t]} ${activeBorder} ${textStyles}`}
                      >
                        {names[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Reading Mode Switcher */}
              <div className="flex flex-col gap-1.5">
                <span className={`font-label-sm text-[10px] uppercase tracking-widest ${accentTextClasses[theme]}`}>Reading Mode</span>
                <div className={`grid grid-cols-2 gap-1.5 p-0.5 rounded-lg border ${inputBgClasses[theme]}`}>
                  <button
                    onClick={() => handleModeChange("scroll")}
                    className={`py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      readingMode === "scroll"
                        ? (theme === "sepia" ? "bg-[#8b6d4f] text-white shadow-sm" : "bg-primary text-on-primary shadow-sm")
                        : (theme === "sepia" ? "text-[#5c4a37] hover:bg-[#dfd4c0]" : "text-on-surface-variant hover:text-on-surface")
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">format_align_justify</span>
                    Scroll
                  </button>
                  <button
                    onClick={() => handleModeChange("single")}
                    className={`py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      readingMode === "single"
                        ? (theme === "sepia" ? "bg-[#8b6d4f] text-white shadow-sm" : "bg-primary text-on-primary shadow-sm")
                        : (theme === "sepia" ? "text-[#5c4a37] hover:bg-[#dfd4c0]" : "text-on-surface-variant hover:text-on-surface")
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">chrome_reader_mode</span>
                    Page Flip
                  </button>
                </div>
              </div>

              {/* 5. Autoplay Webtoon Scroll Panel (only in scroll mode) */}
              {readingMode === "scroll" && (
                <div className="flex flex-col gap-1.5">
                  <span className={`font-label-sm text-[10px] uppercase tracking-widest ${accentTextClasses[theme]}`}>Webtoon Auto-Scroll</span>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${inputBgClasses[theme]}`}>
                    <button
                      onClick={() => setAutoScrollActive((v) => !v)}
                      className={`p-1.5 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                        autoScrollActive
                          ? (theme === "sepia" ? "bg-amber-800 text-white" : "bg-primary text-on-primary")
                          : (theme === "sepia" ? "bg-[#cbbeaa]/40 text-[#2d2319] hover:bg-[#bfae99]/60" : "bg-surface-container-high hover:bg-surface-container-highest text-on-surface")
                      }`}
                      title={autoScrollActive ? "Pause Autoplay" : "Start Autoplay"}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {autoScrollActive ? "pause" : "play_arrow"}
                      </span>
                    </button>
                    <span className="material-symbols-outlined text-[15px] text-on-surface-variant select-none">slow_motion_video</span>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={autoScrollSpeed}
                      onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                      className="flex-1 h-1 rounded-lg appearance-none cursor-pointer outline-none bg-surface-container-highest accent-primary"
                    />
                    <span className="font-label-sm text-[10px] text-on-surface-variant select-none font-mono">
                      {autoScrollSpeed}x
                    </span>
                  </div>
                </div>
              )}

              {/* Scale Slider */}
              <div className="flex flex-col gap-2">
                <span className={`font-label-sm text-[10px] uppercase tracking-widest ${accentTextClasses[theme]}`}>Width Customizer</span>
                <div className={`flex items-center gap-2 px-3 py-2 rounded border ${inputBgClasses[theme]}`}>
                  <span className="material-symbols-outlined text-[15px] text-on-surface-variant select-none">zoom_out</span>
                  <input
                    type="range"
                    min="320"
                    max="1100"
                    step="10"
                    value={readerWidth}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="flex-1 h-1 rounded-lg appearance-none cursor-pointer outline-none bg-surface-container-highest accent-primary"
                  />
                  <span className="material-symbols-outlined text-[15px] text-on-surface-variant select-none">zoom_in</span>
                  <span className="font-label-sm text-[10px] text-on-surface-variant select-none min-w-[32px] text-right font-mono">
                    {readerWidth}px
                  </span>
                </div>
              </div>

              {/* Page Count */}
              <div className={`flex justify-between items-center px-3 py-2 rounded border font-label-sm text-[11px] uppercase tracking-widest ${inputBgClasses[theme]} ${accentTextClasses[theme]}`}>
                <span>Progress</span>
                <span className="font-mono">{currentPage} / {totalPages || "—"}</span>
              </div>
            </div>

            {/* Quick Navigation Controls */}
            <div className="grid grid-cols-3 gap-2 border-t border-surface-container-highest/20 pt-3 flex-shrink-0">
              {prev ? (
                <Link
                  to="/read/$id"
                  params={{ id: prev.id }}
                  className={`flex flex-col items-center justify-center p-2 rounded border hover:border-primary transition-all gap-1 ${inputBgClasses[theme]} text-on-surface-variant hover:text-primary`}
                >
                  <span className="material-symbols-outlined text-lg">skip_previous</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold">Prev</span>
                </Link>
              ) : (
                <div className={`p-2 rounded border opacity-30 flex flex-col items-center justify-center gap-1 ${inputBgClasses[theme]}`}>
                  <span className="material-symbols-outlined text-lg">skip_previous</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold">Prev</span>
                </div>
              )}

              {mangaId ? (
                <Link
                  to="/manga/$id"
                  params={{ id: mangaId }}
                  className={`flex flex-col items-center justify-center p-2 rounded border hover:border-primary transition-all gap-1 ${inputBgClasses[theme]} text-on-surface-variant hover:text-primary`}
                >
                  <span className="material-symbols-outlined text-lg">list</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold">Index</span>
                </Link>
              ) : (
                <div className={`p-2 rounded border opacity-30 flex flex-col items-center justify-center gap-1 ${inputBgClasses[theme]}`}>
                  <span className="material-symbols-outlined text-lg">list</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold">Index</span>
                </div>
              )}

              {next ? (
                <Link
                  to="/read/$id"
                  params={{ id: next.id }}
                  className={`flex flex-col items-center justify-center p-2 rounded border transition-all gap-1 ${theme === "sepia" ? "bg-[#8b6d4f] border-[#8b6d4f] text-white" : "bg-primary border-primary text-on-primary hover:bg-primary/95"}`}
                >
                  <span className="material-symbols-outlined text-lg">skip_next</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold">Next</span>
                </Link>
              ) : (
                <div className={`p-2 rounded border opacity-30 flex flex-col items-center justify-center gap-1 ${inputBgClasses[theme]}`}>
                  <span className="material-symbols-outlined text-lg">skip_next</span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold">Next</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Action Book Button with pulsing glow ring */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleMenu();
          }}
          onMouseEnter={() => setIsHoveringHud(true)}
          onMouseLeave={() => setIsHoveringHud(false)}
          className={`relative w-16 h-16 rounded-full shadow-[0_0_40px_rgba(255,180,180,0.45)] flex items-center justify-center cursor-pointer transition-all duration-300 pointer-events-auto transform scale-100 hover:scale-108 active:scale-95 border border-white/10 backdrop-blur-xl ${
            menuOpen
              ? "bg-surface-container-highest text-primary border border-primary/20"
              : "bg-[#f5a6a6] text-black"
          }`}
          title={menuOpen ? "Close reader menu" : "Open reader menu"}
        >
          {/* Pulsing ring outside the button (visible when onboarding hint is active) */}
          {showHint && (
            <div className="absolute inset-0 rounded-full border-2 border-[#ffd2d2] animate-reader-pulse-ring pointer-events-none" />
          )}

          <span className="material-symbols-outlined text-3xl font-bold select-none">
            {menuOpen ? "close" : "menu_book"}
          </span>
        </button>
      </div>
    </div>
  );
}
