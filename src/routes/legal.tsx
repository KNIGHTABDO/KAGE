import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal Center — KAGE" },
      { name: "description", content: "KAGE Legal Information, Terms of Service, and Privacy Policy." },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <SiteShell>
      <div className="px-margin-mobile md:px-margin-desktop py-8 md:py-16 w-full max-w-3xl mx-auto space-y-12">
        <header className="border-b border-surface-container-highest pb-6">
          <h1 className="font-display-lg text-3xl sm:text-5xl text-on-surface font-bold tracking-tight">Legal Center</h1>
          <p className="font-body-md text-body-md md:text-body-lg text-on-surface-variant mt-2 leading-relaxed">
            Important information regarding disclaimers, intellectual property, and user privacy policies on KAGE.
          </p>
        </header>

        {/* Section 1: Disclaimer */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">gavel</span>
            <h2 className="font-headline-md text-xl font-bold tracking-wide uppercase">1. Important Disclaimer</h2>
          </div>
          <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-3">
            <p>
              KAGE is an open-source, self-hosted frontend reading client. It operates strictly as a parser interface that retrieves and formats data on-demand from publicly available third-party web endpoints.
            </p>
            <p className="font-semibold text-on-surface">
              KAGE does not host, store, index, cache, or redistribute any media files, manga chapters, cover images, or PDF pages on its servers.
            </p>
            <p>
              Any links resolved or content rendered inside the reader are fetched dynamically in the user's browser from public servers. The developers of KAGE have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites.
            </p>
          </div>
        </section>

        {/* Section 2: Intellectual Property */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">copyright</span>
            <h2 className="font-headline-md text-xl font-bold tracking-wide uppercase">2. Intellectual Property</h2>
          </div>
          <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-3">
            <p>
              All copyrights, trademarks, brand names, and intellectual assets associated with manga, manhwa, manhua, or novels belong entirely to their respective authors, artists, official publishers, and licensed distributors.
            </p>
            <p>
              KAGE is built solely for educational, personal research, and backup interface demonstration purposes. We highly encourage and urge all users of KAGE to support the original creators and publishers by purchasing licensed print editions or subscribing to official streaming applications.
            </p>
          </div>
        </section>

        {/* Section 3: Privacy Policy */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">security</span>
            <h2 className="font-headline-md text-xl font-bold tracking-wide uppercase">3. Privacy Policy (100% Local)</h2>
          </div>
          <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-3">
            <p>
              KAGE is designed to be **100% private and client-side by default**.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                **Zero Server Databases**: KAGE does not maintain any databases, cloud users, or profiles.
              </li>
              <li>
                **Local Storage**: 100% of your reading progress (Continue Reading), bookmarked titles (Saved), reader width sizing, reading mode selections, and AMOLED/Sepia background themes are stored locally in your browser's <code className="bg-surface-container-high px-1 py-0.5 rounded text-primary font-mono text-sm">localStorage</code>.
              </li>
              <li>
                **No Cookies or Tracking**: KAGE does not inject cookies, tracking analytics, or user monitoring scripts.
              </li>
            </ul>
            <p>
              You can instantly reset all saved titles and progress at any time directly using the "Clear All" sweep controls located on the <Link to="/library" className="text-primary hover:underline">Library Page</Link>.
            </p>
          </div>
        </section>

        {/* Section 4: Open Source License */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">badge</span>
            <h2 className="font-headline-md text-xl font-bold tracking-wide uppercase">4. Open Source License</h2>
          </div>
          <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-3">
            <p>
              The code representing the KAGE client application is open-sourced under the terms of the MIT License. You are free to view, customize, and self-host the repository for personal use, provided all original licensing notices are retained.
            </p>
            <p className="text-sm border-t border-surface-container-highest/20 pt-6 text-on-surface-variant/60 uppercase tracking-wider">
              © 2026 KAGE Developer • Made with Care
            </p>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
