import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
} as const;

export const Route = createFileRoute("/api/public/mangabuddy/$")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request, params }) => {
        const splat = (params as { _splat?: string })._splat ?? "";
        const incomingUrl = new URL(request.url);

        if (splat === "image-proxy") {
          const imageUrl = incomingUrl.searchParams.get("url");
          if (!imageUrl) {
            return new Response("Missing url parameter", { status: 400, headers: CORS });
          }

          let targetUrl = imageUrl;
          if (targetUrl.startsWith("//")) {
            targetUrl = "https:" + targetUrl;
          } else if (targetUrl.startsWith("/")) {
            targetUrl = "https://mangabuddy.com" + targetUrl;
          }

          try {
            const res = await fetch(targetUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://mangabuddy.com/",
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
              }
            });

            if (!res.ok) {
              return new Response(`Image fetch failed with status ${res.status}`, { status: res.status, headers: CORS });
            }

            const buffer = await res.arrayBuffer();
            return new Response(buffer, {
              status: 200,
              headers: {
                "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
                "Cache-Control": "public, max-age=86400",
                ...CORS,
              }
            });
          } catch (err) {
            return new Response(String(err), { status: 502, headers: CORS });
          }
        }

        const search = incomingUrl.search || "";
        const url = `https://mangabuddy.com/${splat}${search}`;
        try {
          const res = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
          });
          if (!res.ok) {
            return new Response(
              JSON.stringify({ error: `MangaBuddy returned ${res.status}` }),
              {
                status: res.status,
                headers: { "Content-Type": "application/json", ...CORS },
              }
            );
          }
          const html = await res.text();
          
          // If the caller requested raw HTML, return it directly
          if (incomingUrl.searchParams.get("html") === "true") {
            return new Response(html, {
              status: 200,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "public, max-age=120",
                ...CORS,
              },
            });
          }

          const match = html.match(/var\s+chapImages\s*=\s*['"]([^'"]+)['"]/i);
          const images = match ? match[1].split(",") : [];
          return new Response(JSON.stringify({ images }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=600",
              ...CORS,
            },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: String(err) }),
            {
              status: 502,
              headers: { "Content-Type": "application/json", ...CORS },
            }
          );
        }
      },
    },
  },
});
