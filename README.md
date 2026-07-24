<!-- xonettn -->
<div align="center">

# 🤖 Brainwidth

BrainBandwidth is an AI-assisted cognitive load planner that helps you schedule tasks, prevent burnout, and optimize daily mental energy.


![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)

![Deploy](https://img.shields.io/badge/Deployed-Netlify-00C7B7?logo=netlify&logoColor=white)

</div>

---

## 📋 Overview
BrainBandwidth is an AI-assisted cognitive load planner that helps you schedule tasks, prevent burnout, and optimize daily mental energy.

## 📦 Tech Stack
- React
- Vite
- Express
- Netlify (deployed)

## 🗂️ Project Structure
```
brainwidth/
  - public
  - src
  (39 files total)
```

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js (v18+)
- npm or yarn

### 📦 Installation
```bash
git clone https://github.com/1nc0gn30/brainwidth.git
cd brainwidth
npm install
```

### 💻 Development
```bash
npm run dev
```

### 🔨 Build
```bash
npm run build
```

### ⚙️ Available Scripts
  npm run dev - tsx server.ts
  npm run build - vite build
  npm run preview - vite preview
  npm run clean - rm -rf dist
  npm run lint - tsc --noEmit

## 📂 Original README
<details>
<summary>Click to expand original README</summary>

# BrainBandwidth

BrainBandwidth is an AI-assisted cognitive load planner that helps people organize tasks around mental energy, avoid overload, and plan sustainable workdays.

Live domain: `https://brainwidth.757tech.pro`
Author: `Tech Pro`

## ✨ Features

- AI-backed daily insights from your task load
- Bandwidth-aware planning by day, week, month, and year
- Calendar and recurring task support
- Focus mode for active tasks
- Import/export for local task data
- Optional personal Gemini API key support

## 📦 Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Express + better-sqlite3 (AI/rate-limit API proxy)

## 💻 Local Development

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

## 🔨 Build and Preview

Build production assets:

```bash
npm run build
```

Preview the static build:

```bash
npm run preview
```

## 🚀 Netlify Deployment

This project includes `netlify.toml` with:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: `/* -> /index.html` (200)
- Basic security headers

After connecting the repo to Netlify, deploys should work without extra config.

## 🔍 SEO and Social Metadata

SEO assets are configured for `https://brainwidth.757tech.pro`:

- Canonical + Open Graph + Twitter tags in `index.html`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/site.webmanifest`
- Favicon/app icons in `public/`
- OG image: `public/og-image.png`

If you want the OG image to be a real deploy preview screenshot, replace `public/og-image.png` with a 1200x630 capture from the live preview URL.

</details>

## 📝 TODO / Roadmap
- [ ] Add unit tests
- [ ] Add LICENSE file
- [ ] Add Dockerfile for containerized deployment
- [ ] Consider adding Tailwind CSS
- [ ] Add CI/CD pipeline
- [ ] Add contribution guidelines (CONTRIBUTING.md)
- [ ] Improve error handling and edge cases
- [ ] Add environment variable documentation
- [ ] Update dependencies to latest versions
- [ ] Add code comments and inline documentation

## 🚀 Deployment
This project is deployed on Netlify. See netlify.toml for configuration.

## 👤 Author
**Neal Frazier** - [@AshAmplifies](https://github.com/1nc0gn30)

## 🔗 Links
- GitHub: https://github.com/1nc0gn30/brainwidth

---
*This README was enhanced as part of the neals-projects-2026 batch update.*

---

<div align="center">

**[xonettn]** · Built by [Neal Frazier](https://github.com/1nc0gn30) · [@AshAmplifies](https://twitter.com/AshAmplifies)

</div>
