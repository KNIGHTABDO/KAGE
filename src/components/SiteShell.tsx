import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

type NavItem = { to: string; icon: string; label: string };

const NAV: NavItem[] = [
  { to: "/", icon: "dashboard", label: "Home" },
  { to: "/browse", icon: "explore", label: "Browse" },
  { to: "/search", icon: "search", label: "Search" },
  { to: "/library", icon: "auto_stories", label: "Library" },
];

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <nav className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-surface/60 backdrop-blur-3xl border-r border-surface-container-highest flex-col py-margin-desktop px-8 z-50">
      <Link to="/" className="mb-12 block">
        <h1 className="font-display-lg text-display-lg-mobile uppercase tracking-tighter text-primary">KAGE</h1>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-2 tracking-widest uppercase">Elite Reader</p>
      </Link>
      <ul className="flex-grow space-y-6">
        {NAV.map((n) => {
          const active = isActive(pathname, n.to);
          return (
            <li key={n.label}>
              <Link
                to={n.to}
                className={
                  active
                    ? "flex items-center gap-4 text-primary font-bold border-r-2 border-primary group pr-4 py-2 transition-all duration-300"
                    : "flex items-center gap-4 text-on-surface-variant opacity-70 hover:text-primary hover:opacity-100 transition-all duration-300 group pr-4 py-2"
                }
              >
                <span
                  className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform duration-200 ease-in-out"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {n.icon}
                </span>
                <span className="font-label-md text-label-md">{n.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-6 pt-6 border-t border-surface-container-highest">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest opacity-60">
          Powered by MangaBuddy
        </p>
      </div>
    </nav>
  );
}

export function MobileTopNav() {
  return (
    <nav className="md:hidden fixed top-0 inset-x-0 z-50 bg-surface/70 backdrop-blur-3xl flex justify-between items-center px-margin-mobile py-3 border-b border-surface-variant/20">
      <Link to="/" className="font-display-lg-mobile text-2xl tracking-tighter text-primary uppercase">KAGE</Link>
      <Link to="/search" className="text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-2xl">search</span>
      </Link>
    </nav>
  );
}

export function MobileBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-3xl border-t border-surface-variant/20 px-2 py-2 flex justify-around items-center safe-bottom">
      {NAV.map((n) => {
        const active = isActive(pathname, n.to);
        return (
          <Link
            key={n.label}
            to={n.to}
            className={
              active
                ? "flex flex-col items-center gap-0.5 text-primary px-3 py-1.5"
                : "flex flex-col items-center gap-0.5 text-on-surface-variant opacity-70 px-3 py-1.5"
            }
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {n.icon}
            </span>
            <span className="text-[10px] uppercase tracking-widest font-semibold">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-surface py-10 border-t border-surface-container-highest flex flex-col items-center justify-center gap-4 px-margin-mobile md:px-margin-desktop text-center mt-16">
      <h2 className="font-headline-md text-headline-md text-primary tracking-widest uppercase">KAGE</h2>
      <p className="font-label-sm text-label-sm text-on-surface-variant max-w-md">
        A reading client for open manga catalogs. All content & rights belong to their respective creators.
      </p>
      <div className="flex gap-4">
        <Link to="/legal" className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all">
          Legal Center
        </Link>
      </div>
      <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant/50 mt-1">
        © 2026 KAGE
      </p>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Sidebar />
      <MobileTopNav />
      <div className="md:ml-64 min-h-screen flex flex-col">
        <main className="flex-1 pt-14 md:pt-0 pb-24 md:pb-0">{children}</main>
        <SiteFooter />
      </div>
      <MobileBottomNav />
    </>
  );
}
