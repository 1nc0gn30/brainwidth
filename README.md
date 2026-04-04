# BrainBandwidth

BrainBandwidth is an AI-assisted cognitive load planner that helps people organize tasks around mental energy, avoid overload, and plan sustainable workdays.

Live domain: `https://brainwidth.757tech.pro`
Author: `Tech Pro`

## Features

- AI-backed daily insights from your task load
- Bandwidth-aware planning by day, week, month, and year
- Calendar and recurring task support
- Focus mode for active tasks
- Import/export for local task data
- Optional personal Gemini API key support

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Express + better-sqlite3 (AI/rate-limit API proxy)

## Local Development

Prerequisites:

- Node.js 20+
- npm 10+

Setup:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local env file and set your key:
   ```bash
   cp .env.example .env.local
   ```
   Set `GEMINI_API_KEY` in `.env.local`.
3. Start development server:
   ```bash
   npm run dev
   ```

## Build and Preview

Build production assets:

```bash
npm run build
```

Preview the static build:

```bash
npm run preview
```

## Netlify Deployment

This project includes `netlify.toml` with:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: `/* -> /index.html` (200)
- Basic security headers

After connecting the repo to Netlify, deploys should work without extra config.

## SEO and Social Metadata

SEO assets are configured for `https://brainwidth.757tech.pro`:

- Canonical + Open Graph + Twitter tags in `index.html`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/site.webmanifest`
- Favicon/app icons in `public/`
- OG image: `public/og-image.png`

If you want the OG image to be a real deploy preview screenshot, replace `public/og-image.png` with a 1200x630 capture from the live preview URL.
