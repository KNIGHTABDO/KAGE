# 🥷 KAGE — Premium Open-Source Manga & Webtoon Reader

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Built With React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Built With TanStack](https://img.shields.io/badge/TanStack-Start-ff4081?style=for-the-badge)](https://tanstack.com/router)

**KAGE** is an ultra-premium, high-performance, distraction-free web manga and webtoon reading client. Built using a modern server-side rendering stack powered by **React 19**, **TanStack Start (Router + Vinxi)**, and **Tailwind CSS**, KAGE delivers a seamless, lightning-fast native experience designed to wow readers.

KAGE parses and displays chapters natively using **MangaBuddy** as its single, high-reliability data provider, completely bypassing annoying redirections, heavy advertisements, and intrusive popups.

---

## ✨ Key Features

* **📖 Single-Source MangaBuddy Integration**: Completely rewritten backend client resolving metadata, lists, searches, and native chapter feeds on-demand with zero page redirections.
* **⚡ Pristine Immersive Reading Canvas**: 100% full-screen layout with absolutely zero persistent header or footer bars covering the manga panels.
* **🎡 Fluid Floating settings Card (FAB)**: A gorgeous, glassmorphic Control Center in the bottom-right corner to customize your reading layout in real-time.
* **📱 Scrollable Settings Panel**: Viewport-constrained settings layout (`max-h-[70vh]`) featuring sticky manga details and quick nav footers, allowing standard controls to scroll smoothly on mobile and small screens.
* **🚗 Hands-free Webtoon Auto-Scroll**: SILK-smooth, hardware-accelerated scroll loop (`requestAnimationFrame`) with speed multipliers ($1x$ to $8x$). Ignores normal HUD closing clicks while instantly pausing on manual mouse wheel or touch swipes.
* **🎭 Ambient Themes (AMOLED, Charcoal, Sepia)**: Toggle backgrounds instantly. The Control FAB and settings components transform their styling, colors, and shadows to match your active layout.
* **📖 Smart Page-Flip Mode**: Toggle between continuous webtoon scroll and a standard page-by-page flip mode. Tap the left/right 35% sectors or use keyboard arrows/spacebar to flip pages, while the middle 30% toggles settings.
* **🔄 Chronological Chapter Order**: Automatic sibling resolution in ascending order (Ch. 0, Ch. 1, Ch. 2...) for perfectly calculated Previous/Next buttons.
* **🛡️ Secure Server-Side Image Proxy**: A clean node proxy endpoint (`/api/public/mangabuddy/image-proxy`) streaming binary data with spoofed headers (`Referer: https://mangabuddy.com/`) to successfully bypass hotlinking blocks.
* **📦 Complete Library Management**: Track your reading history (Continue Reading), bookmark your favorite titles (Saved), remove individual items with hover-reveal close buttons, or reset lists instantly using sweep buttons.
* **✨ Onboarding popover**: Interactive gold-dashed onboarder card guiding new readers with a waving emoji and animated curved vector SVG arrows.

---

## 🛠️ Technology Stack

* **Core Framework**: React 19 & TanStack Start
* **Bundler & Router**: Vinxi & TanStack Router (File-Based)
* **Styling**: Tailwind CSS & Material Symbols Icons
* **Data Fetching**: TanStack Query (React Query v5)
* **State Persistency**: Browser `localStorage` (Privacy-First)

---

## 🚀 Quick Start

### Prerequisites

Ensure you have **Node.js (v20+)** and **Bun** (or `npm`) installed.

### 1. Clone & Install

```bash
git clone https://github.com/your-username/kage.git
cd kage
bun install # or npm install
```

### 2. Run Locally

Start the developer server at `http://localhost:8080`:

```bash
bun run dev # or npm run dev
```

### 3. Build & Production Check

Compile the static assets and server bundles:

```bash
bun run build # or npm run build
bun run preview # test build locally
```

---

## ☁️ Deployment

### Deploy to Vercel (Recommended)

KAGE runs seamlessly on **Vercel** with full SSR support.

1. **Push your code** to GitHub, GitLab, or Bitbucket.
2. **Import your repository** into Vercel.
3. Vercel automatically detects the TanStack Start / Vite setup.
4. **Deploy!**

### Deploy to Cloudflare Pages / Workers

KAGE includes built-in configurations (`wrangler.jsonc` and `@cloudflare/vite-plugin`) to deploy as a high-performance Cloudflare Worker.

```bash
bun run build
wrangler deploy
```

---

## ⚖️ Legal Disclaimer

KAGE is a self-hosted frontend reading client. 
* It **does not host, store, index, or redistribute** any manga chapters, cover arts, or page media.
* All parsed metadata and images are retrieved on-demand from public third-party endpoints.
* Users are entirely responsible for their own self-hosting setups. All rights, copyrights, and intellectual assets belong to their respective creators, publishers, and authors.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
