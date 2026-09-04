# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.1] - 2026-09-04

### Fixed
- Improved rendering performance by loading home page cards instantly using local JSON files.

## [2.0.0] - 2026-09-01

### Added
- **Search & Filtering:** Added `FilterBar` and Explore page components with support for categories, organizational units, and advanced search filters.
- **Navigation:** Implemented a new navigation component with styling support for explore and upcoming views.

## [1.4.0] - 2026-08-08

### Added
- **UI Enhancements:** Increased description character limit and updated contribution list styling for better readability.
- **Documentation:** Updated `README.md` with Cloudflare Pages deployment configuration and details on new project files.

## [1.3.0] - 2026-08-07

### Changed
- **Branding:** Updated typography and color palette to align with official IEEE brand guidelines.
- **Documentation:** Added IEEE brand identity guidelines for colors and typography.

## [1.2.0] - 2026-08-01

### Added
- **Analytics:** Integrated Cloudflare Web Analytics script into `index.html`.
- **Contribution Form:** Persisted contributor contact details in `localStorage` and added form reset functionality with success UI updates. Added an "Other" option for custom organization names in benefit submissions.
- **Organizations:** Added IEEE Industry Engagement Committee.

### Changed
- **Explore & Grouping:** Reordered categories and set the default explore view to group by category.
- **Copywriting:** Updated hero section heading and description for a broader IEEE membership focus.

## [1.1.0] - 2026-07-09

### Added
- **Explore & Grouping:** Implemented benefit grouping by category and organization unit on the Explore page.
- **Contribution Form:** Redesigned contribution form checkboxes into interactive styled cards with descriptive labels.
- **Search & Filtering:** Implemented `FilterBar` component and pinned it to the top of the interface.

## [1.0.0] - 2026-04-07

### Added
- **Initial Release:** Launched the initial version of the IEEE Benefits dashboard.
- **Core Features:** Implemented the core dashboard allowing users to view, explore, and filter various IEEE benefits and templates.
- **Organizations:** Populated comprehensive data for all participating IEEE Organizational Units (OUs) along with their respective logos and an icon-based fallback system.
- **UI & Navigation:** Designed a responsive interface including mobile navigation menus, dynamic category-based styling, polished Benefit Cards, and animated loading states.
