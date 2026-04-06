# IEEE Benefits Explorer

A modern, crowdsourced platform that helps IEEE members and students discover grants, competitions, awards, fellowships, funding, and other opportunities tailored to their interests and eligibility.

> **Live data powered by Google Sheets + Apps Script** — the app fetches verified benefits from a Google Sheet backend in real time, with local JSON fallbacks for offline resilience.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Data Loading Strategy](#data-loading-strategy)
- [Static Data Files](#static-data-files)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Additional Documentation](#additional-documentation)

---

## Features

- **Discover Opportunities** — Browse awards, competitions, funding, programs, fellowships, travel grants, mentorship, and more.
- **Personalized Recommendations** — Onboarding flow captures your interests, region, and demographics to surface a curated "For You" feed.
- **Smart Filtering** — Filter by category, IEEE organizational unit (Society/Region/Council), membership requirement, student eligibility, and deadline.
- **Favorites** — Save opportunities to your personal favorites list (persisted in `localStorage`).
- **Crowdsourced Contributions** — Anyone can submit a new benefit via the `/contribute` page. Submissions land in the Google Sheet as `pending` and appear on the platform only after verification.
- **Offline-First Caching** — The `BenefitsContext` seeds the UI from a `localStorage` cache instantly, then updates in the background from the API.
- **Dark / Light Theme** — Toggleable via user preferences; applied globally through CSS classes.

---

## Tech Stack

| Layer        | Technology                         |
| ------------ | ---------------------------------- |
| Frontend     | React 19, React Router DOM v7      |
| Build Tool   | Vite 8                             |
| Icons        | Lucide React                       |
| Styling      | Vanilla CSS (glassmorphism design) |
| Backend API  | Google Apps Script (Web App)       |
| Data Store   | Google Sheets                      |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                    Frontend (Vite + React)       │
│                                                   │
│  BenefitsContext ──▶ fetchBenefits()             │
│       │                   │                       │
│       │          1. Try Apps Script API           │
│       │             (GET ?verified=true)          │
│       │                   │                       │
│       │          2. Fallback: /data.json          │
│       │                   │                       │
│       │          3. Fallback: /data.example.json  │
│       │                                           │
│  Contribute Page ──▶ submitContribution()        │
│                         POST to Apps Script       │
└────────────────────┬────────────────────────────-─┘
                     │
          ┌──────────▼──────────┐
          │  Google Apps Script  │
          │   (Web App - doGet   │
          │    / doPost)         │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │   Google Sheet       │
          │   (Sheet: "data")    │
          └─────────────────────┘
```

For full details on setting up the Google Sheet and Apps Script backend, see **[SETUP.md](./SETUP.md)**.

---

## Project Structure

```
benefits/
├── appscript/               # Google Apps Script source (reference copy)
│   └── Code.gs.js           # doGet / doPost handlers
├── public/                  # Static assets served by Vite
│   ├── categories.json      # Opportunity category definitions
│   ├── data.example.json    # Sample benefits data (fallback & reference)
│   ├── spos.json            # IEEE organizational units (Societies, Regions, Councils)
│   ├── logos/               # Brand logos
│   └── *.png / *.svg        # Favicons and app icons
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── BenefitCard.jsx  # Opportunity card display
│   │   ├── FilterSidebar.jsx # Filter controls (category, OU, eligibility)
│   │   ├── Footer.jsx
│   │   ├── MetaNav.jsx      # Top metadata bar
│   │   ├── Navigation.jsx   # Primary nav bar
│   │   └── OnboardingModal.jsx # First-time user preference setup
│   ├── context/             # React Context providers
│   │   ├── BenefitsContext.jsx  # Global benefits state + caching
│   │   ├── FavoritesContext.jsx # Saved favorites (localStorage)
│   │   └── PreferencesContext.jsx # User preferences (theme, onboarding)
│   ├── hooks/
│   │   └── useBenefits.js   # Re-export of BenefitsContext hook
│   ├── pages/
│   │   ├── Home.jsx         # Dashboard with stats & "For You" feed
│   │   ├── Explore.jsx      # Browse & filter all opportunities
│   │   ├── Favorites.jsx    # Saved favorites view
│   │   └── Contribute.jsx   # Crowdsourced submission form
│   ├── services/
│   │   └── api.js           # Data fetching (Apps Script + fallbacks)
│   └── styles/              # Shared / global stylesheets
├── .env.example             # Template for environment variables
├── vite.config.js           # Vite configuration (envPrefix settings)
├── package.json
└── README.md                # ← You are here
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd benefits

# 2. Install dependencies
npm install

# 3. Copy environment template and configure
cp .env.example .env
# Edit .env — see "Environment Variables" section below

# 4. Start the development server
npm run dev
```

The app will be available at **`http://localhost:5173`**.

---

## Environment Variables

The app uses environment variables to connect to the Google Apps Script backend and control feature flags.

| Variable                  | Required | Description                                                                                                                  |
| ------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `APP_SCRIPT_URL`          | Yes*     | The deployed Google Apps Script Web App URL. Used to fetch live benefits data and accept contributions.                        |
| `VITE_ENABLE_CONTRIBUTE`  | No       | Feature flag to show/hide the **Contribute** link in the navigation bar. Set to `true` to enable, `false` to disable. Defaults to `false`. |
| `VITE_ENABLE_PERSONALIZE` | No       | Feature flag to show/hide the **Personalize** button. Set to `true` to enable, `false` to disable. Defaults to `true`. |

> \* The app **will still run** without `APP_SCRIPT_URL` — it falls back to local `data.json` → `data.example.json`. However, contributions and live data sync will not work.

### Setup

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Set the variables in `.env`:
   ```env
   APP_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   VITE_ENABLE_CONTRIBUTE=true   # Set to false to hide the Contribute page from the nav
   VITE_ENABLE_PERSONALIZE=true  # Set to false to hide the Personalize button
   ```

3. Restart the dev server for the change to take effect.

### How Vite exposes this variable

In `vite.config.js`, the `envPrefix` is configured as:

```js
envPrefix: ['VITE_', 'APP_SCRIPT_URL'],
```

This makes `APP_SCRIPT_URL` accessible via `import.meta.env.APP_SCRIPT_URL` inside the React app without requiring the `VITE_` prefix. The code also checks `import.meta.env.VITE_APP_SCRIPT_URL` for compatibility — either name works.

> **⚠️ Security Note:** The Apps Script URL is a **public** web app endpoint and is safe to expose on the client side. The Google Sheet itself controls write access, and submitted entries are always set to `status: "pending"` and `verified: false` server-side.

### Additional `.env` variables (for reference only)

These are stored in `.env` for developer convenience but are **not used by the app at runtime**:

| Variable       | Purpose                                        |
| -------------- | ---------------------------------------------- |
| `SHEET_URL`    | Direct link to the Google Sheet (for editors)  |
| `PROJECT_URL`  | Direct link to the Apps Script project editor   |

---

## Data Loading Strategy

The app implements a **two-stage, offline-first loading strategy** managed by `BenefitsContext`:

```
1. INSTANT (synchronous):
   └─ Hydrate state from localStorage cache ("db_benefits_cache")
      └─ UI renders immediately with cached data (no loading spinner)

2. BACKGROUND (async):
   └─ Fetch fresh data from Apps Script API (?verified=true)
      ├─ ✅ Success → Update state + refresh cache
      ├─ ❌ Fail → Try /data.json (local file)
      │       ├─ ✅ Success → Update state + refresh cache
      │       └─ ❌ Fail → Try /data.example.json
      └─ All fail → Keep showing cached data (or empty)
```

This approach ensures:
- **Zero perceived load time** for returning users (cache-first).
- **Always fresh data** once the API responds (background refresh).
- **Graceful degradation** when offline or when the API is unavailable.

---

## Static Data Files

These files live in `public/` and are served directly by Vite at the root URL path:

### `data.example.json`

Sample benefits data that ships with the repo. Acts as the **last-resort fallback** and as a schema reference for contributors.

Each benefit object has the following fields:

| Field                     | Type            | Description                                                                                       |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `id`                      | `string`        | Unique identifier (e.g., `"award-1"`, `"comp-1"`)                                                |
| `title`                   | `string`        | Benefit name                                                                                      |
| `description`             | `string`        | Brief description (max ~500 chars)                                                                |
| `category`                | `string`        | Must match a title in `categories.json` (e.g., `"Awards"`, `"Competitions"`, `"Funding"`)         |
| `url`                     | `string`        | Primary URL for more information                                                                  |
| `spoName`                 | `string`        | IEEE organizational unit name — must match a `spoName` in `spos.json`                             |
| `date`                    | `string\|null`  | Event date or descriptive text (e.g., `"Announcing Soon"`)                                        |
| `deadline`                | `string\|null`  | Application deadline in **`YYYY-MM-DD`** format (no timestamp)                                    |
| `status`                  | `string`        | `"Active"` or `"pending"` — only `Active` + `verified: true` entries show in the explorer          |
| `verified`                | `boolean`       | Whether the entry has been verified by a maintainer                                                |
| `ieeeMembershipRequired`  | `boolean`       | `true` if IEEE membership is strictly required                                                    |
| `student`                 | `boolean`       | `true` if only available to students                                                              |
| `annual`                  | `boolean`       | `true` if this is a recurring annual opportunity                                                  |

> **Important:** The `deadline` field must be formatted as `YYYY-MM-DD` (e.g., `2026-05-15`) **without** a trailing timestamp (like `T23:59:59Z`). This ensures the UI parses it consistently under UTC for users in all timezones.

### `categories.json`

Defines the available opportunity categories, their icons (from Lucide), and whether they are currently active:

```json
{
  "title": "Awards",
  "icon": "Award",
  "description": "Recognize outstanding contributions and achievements.",
  "linkedPage": null,
  "disabled": false
}
```

Categories with `"disabled": true` are defined but not yet populated with data.

### `spos.json`

A comprehensive dataset of IEEE **S**ocieties/**P**lanning **O**rganizational units including:

- Technical Societies (e.g., IEEE Computer Society)
- Geographic Regions (e.g., IEEE Region 10)
- Councils (e.g., IEEE Council on RFID)
- MGA Committees (e.g., MGA Student Activities Committee)

Each entry includes `hiddenSpoId`, `spoName`, `parentName`, `spoAcctType`, and search tags. This data powers the Organization Unit dropdown in the Contribute form and the filter sidebar.

> **Note:** `public/data.json` is **git-ignored**. It can be used for local overrides of the benefits database without affecting the repo.

---

## Available Scripts

| Command              | Description                             |
| -------------------- | --------------------------------------- |
| `npm run dev`        | Start development server with HMR       |
| `npm run build`      | Create optimized production build        |
| `npm run preview`    | Preview the production build locally     |
| `npm run lint`       | Run ESLint checks                        |

---

## Deployment

The production build (`npm run build`) outputs to `dist/` and can be deployed to any static hosting provider:

- **GitHub Pages**
- **Netlify**
- **Vercel**
- **AWS S3 + CloudFront**

> Make sure to set the `APP_SCRIPT_URL` environment variable in your hosting provider's build settings for live data to work in production.

---

## Contributing

Contributions are welcome! See [SETUP.md](./SETUP.md) for backend configuration details before working on data-related features.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

This project uses **ESLint** with the React Hooks and React Refresh plugins. Run `npm run lint` before submitting PRs.

---

## Additional Documentation

| Document                      | Description                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| [SETUP.md](./SETUP.md)       | Google Sheet structure, Apps Script setup, deployment steps, and API reference.      |

---

## License

[Specify your license here]

## Acknowledgments

- Built for IEEE members and students worldwide
- Icons provided by [Lucide](https://lucide.dev/)
- Powered by [React](https://react.dev/) and [Vite](https://vite.dev/)
