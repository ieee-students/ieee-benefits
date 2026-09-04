# Project Rules for Antigravity

## Documentation Maintenance

When making **any code change** to this project, you must keep the following two files up to date before finishing:

### CHANGELOG.md
- Follow the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
- Add new entries under the `## [Unreleased]` section at the top.
- Group changes under the appropriate sub-heading: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, or `Security`.
- Write entries from a **user's perspective** — describe what the user can now do or what improved, not the internal implementation detail.
- Do **not** list trivial changes like dependency bumps, comment edits, or minor formatting tweaks.
- When a new version is released (committed to `main`), move the `[Unreleased]` entries into a new versioned heading (e.g., `## [1.6.0] - YYYY-MM-DD`) and create a fresh empty `## [Unreleased]` block above it.

### README.md
- If a change introduces a **new feature, page, or route**, update the relevant section in the README to reflect it.
- If a change affects **setup, configuration, or environment variables**, update the README accordingly.
- If the change is purely internal (a bug fix, performance improvement, or refactor with no user-visible impact on setup), the README does **not** need to be updated.

---

## Versioning Guidelines
- **Patch** (`x.x.1`): Bug fixes and performance improvements with no new functionality.
- **Minor** (`x.1.x`): New features or enhancements that are backwards compatible.
- **Major** (`x.0.0`): Breaking changes or a significant rewrite of core functionality. (Use sparingly.)

## Git Tags
- When a release is finalized (changes committed and pushed to `main`), apply the appropriate semantic version git tag to the commit: `git tag -a vX.Y.Z -m "Release vX.Y.Z" <commit-hash>`.
- Push tags with `git push origin --tags`.

---

## Design & Branding

All UI changes must adhere to the IEEE Brand Identity Guidelines documented in [`DESIGN.md`](./DESIGN.md).

- **Primary color:** `#00629B` (IEEE Blue). Use it for brand emphasis and primary UI elements.
- **Typography:** Use **Open Sans** for all web interfaces. Do not introduce other font families without a strong reason.
- **Accessibility:** All background/text color combinations must meet **WCAG AA contrast ratio** standards. Use a contrast checker when introducing new color pairs.
- **Iconography:** This project uses [Lucide React](https://lucide.dev/) exclusively. Do not introduce other icon libraries.
- **Dark mode first:** The app defaults to a dark theme. All new UI must look correct and polished in dark mode before considering light mode.

---

## Architecture & Data

### Static Data Files
Three data files live in `public/` and are fetched at runtime. Know their roles before editing anything related to data:

| File | Purpose |
| :--- | :--- |
| `public/categories.json` | Defines benefit categories, their Lucide icon name, color, and enabled state. |
| `public/spos.json` | The full IEEE OU directory (societies, committees, geographic units). |
| `public/spoinfo.json` | Logo/image metadata for OUs, used by `OrgLogo`. |

- `public/data.json` is **git-ignored** and used for local overrides only. Never commit it.
- `public/data.example.json` is the schema reference and last-resort fallback. Keep it up to date if the data schema changes.

### Benefit Data Schema
The `deadline` field must **always** be formatted as `YYYY-MM-DD` (e.g., `2026-05-15`) with **no timestamp suffix**. The app parses dates under UTC; trailing timestamps cause timezone drift bugs.

### Data Loading Strategy
The app uses a **cache-first, background-refresh** strategy managed by `BenefitsContext`:
1. State is hydrated synchronously from `localStorage` (`db_benefits_cache`) — no loading spinner for returning users.
2. The API is fetched in the background, and the cache is updated on success.
3. Fallback chain: `APP_SCRIPT_URL` → `public/data.json` → `public/data.example.json`.

Do not break this pattern. Do not add blocking loading states to the initial render.

### Backend API
The backend is a **Google Apps Script** web app (see [`SETUP.md`](./SETUP.md)). It is configured via `APP_SCRIPT_URL` in `.env`. POST submissions from the Contribute form must always use `Content-Type: text/plain;charset=utf-8` to avoid CORS preflight issues.

---

## Feature Flags

Two feature flags in `.env` control UI visibility. Check their state before adding code that depends on them:

| Variable | Default | Effect |
| :--- | :--- | :--- |
| `VITE_ENABLE_CONTRIBUTE` | `false` | Shows/hides the Contribute page link in the navigation. |
| `VITE_ENABLE_PERSONALIZE` | `true` | Shows/hides the Personalize button in the navigation. |

If you introduce a new feature that should be gated, add it as a `VITE_ENABLE_*` variable and document it in `.env.example` and `README.md`.

---

## Deployment
The app is deployed to **Cloudflare Pages** via Wrangler (`wrangler.jsonc`). It is configured as a single-page application (`not_found_handling: single-page-application`). Do not add server-side routing that conflicts with this. All new routes must be client-side via React Router.
