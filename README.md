# HomeRow

A lightweight, offline-first web app for managing home supplies, recurring bills, and household spending. All data stays in your browser.

**Live site:** [navneet3c.github.io](https://navneet3c.github.io/)

## Features

- **Supplies** — Quick-add items (name + Enter). Optional brand, price, size, photo, and notes. Auto-suggested emoji and category (grocery, food, cosmetics, health, etc.).
- **Bills** — Track recurring bills with amount, category, and frequency. See upcoming dues and mark bills paid.
- **Analytics** — Restock suggestions from purchase patterns, spend by category, weekly/monthly charts, bill estimates.
- **Backup** — Export/import JSON (images excluded). Optional upload to Google Drive.

## Tech stack

| Layer | Choice |
|-------|--------|
| UI | [Preact](https://preactjs.com/) + [Vite](https://vitejs.dev/) |
| Storage | [Dexie](https://dexie.org/) (IndexedDB) |
| Charts | [Chart.js](https://www.chartjs.org/) |

Data is stored locally in IndexedDB (typically hundreds of MB per origin), not in `localStorage`.

## Local development

**Requirements:** Node.js 20+ and npm

```bash
git clone https://github.com/navneet3c/navneet3c.github.io.git
cd navneet3c.github.io
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Other commands:

```bash
npm run build    # production build → dist/
npm run preview  # serve dist/ locally
```

## Deployment (GitHub Pages)

Pushes to `main` run [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the app and publishes `dist/` to the **`gh-pages`** branch.

### One-time Pages setup

1. Repo **Settings → Pages → Build and deployment**
2. **Source:** Deploy from a branch
3. **Branch:** `gh-pages` · **Folder:** `/ (root)`

> **Important:** Do not set Pages source to `main` / `(root)`. That serves the dev `index.html` and raw `.jsx` files, which causes MIME type errors in the browser.

After the workflow completes, the site is at [navneet3c.github.io](https://navneet3c.github.io/).

## Google Drive backup (optional)

1. Create an [OAuth 2.0 Web client](https://console.cloud.google.com/apis/credentials) in Google Cloud Console.
2. Enable the **Google Drive API**.
3. Add your origins under **Authorized JavaScript origins** (e.g. `http://localhost:5173`, `https://navneet3c.github.io`).
4. In the app: **☁️ Backup** → paste the Client ID → **Save ID** → **Upload backup to Drive**.

Or set `VITE_GOOGLE_CLIENT_ID` in a `.env` file (see [.env.example](.env.example)).

## Project structure

```
src/
  app.jsx                 # App shell + routing
  core/
    registry.js           # Module registry (add new features here)
    store.js              # Dexie liveQuery hook
  db/
    schema.js             # IndexedDB schema
  lib/
    categorize.js         # Auto category / emoji
    patterns.js           # Purchase patterns & analytics
    backup.js             # Export / import / Drive upload
    router.js             # Hash-based routing (GitHub Pages)
  modules/
    home/                 # Dashboard
    supplies/             # Supply tracking
    bills/                # Recurring bills
    analytics/            # Charts & suggestions
    backup/               # Backup UI
    _template/            # Copy to add a new module
```

### Adding a module

1. Copy `src/modules/_template/` to `src/modules/<your-module>/`.
2. Register the module in `src/core/registry.js`.
3. Add tables in `src/db/schema.js` if needed (bump Dexie version).

## License

See [LICENSE](LICENSE).
