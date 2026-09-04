# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.1] - 2026-09-04

### Fixed
- Improved initial page load performance by seeding the benefits cache from local JSON files, eliminating the blank loading state on first visit.

## [1.5.0] - 2026-09-01

### Added
- **Upcoming View:** Introduced a dedicated "Upcoming" section accessible via the navigation bar, presenting benefits and opportunities with approaching deadlines in a chronological timeline layout. Items are sorted into past, upcoming (next 3 months), and future windows with a progressive "Show More" reveal pattern.
- **Navigation:** Added "Upcoming" as a first-class navigation link alongside Home and Explore, with accurate active state tracking per view.
- **Explore Enhancements:** Expanded the Explore page with support for Sort By (Default / Date) and Group By (Category / Organization Unit / None) controls, giving users more flexibility over how results are presented.
- **Advanced Filters:** Added an expandable "Advanced Filters" panel within the FilterBar with segmented controls for filtering by Eligibility (Anyone / Students Only / Professionals) and Membership (All / IEEE Required / Open to Non-Members).
- **Active Filters Display:** Introduced an `ActiveFilters` component that displays applied filters as dismissible chips below the FilterBar, with a "Reset Filters" shortcut.

### Changed
- The Explore page now dynamically adjusts its page title and description based on whether the Upcoming view is active.

## [1.4.0] - 2026-08-08

### Added
- **UI Enhancements:** Increased the maximum character limit for benefit descriptions to accommodate more detailed entries. Improved the visual layout of the contribution list for better readability.
- **Documentation:** Updated `README.md` with Cloudflare Pages deployment configuration and details on new project files.

## [1.3.0] - 2026-08-07

### Changed
- **Branding:** Updated the application's typography and color palette to align with official IEEE brand guidelines, ensuring visual consistency across the platform.

## [1.2.0] - 2026-08-01

### Added
- **Analytics:** Integrated Cloudflare Web Analytics for privacy-friendly usage tracking.
- **Contribution Form:** Added an "Other" option to allow contributors to submit benefits from organizations not yet listed. Introduced `localStorage` persistence for contributor contact details and added form reset functionality with a success confirmation state.
- **Organizations:** Added IEEE Industry Engagement Committee to the directory.

### Changed
- **Explore & Grouping:** Reordered benefit categories and set the default Explore view to group by category.
- **Copywriting:** Refreshed the hero section heading and description to reflect a broader IEEE membership audience beyond students.

## [1.1.0] - 2026-07-09

### Added
- **Explore & Grouping:** Implemented benefit grouping by category and by organization unit on the Explore page, enabling users to browse benefits in a structured, sectioned layout.
- **Contribution Form:** Redesigned the organization and category selectors on the contribution form from plain checkboxes into interactive styled cards with icons and descriptive labels.
- **Search & Filtering:** Implemented the `FilterBar` component with keyword search and category/OU dropdown filters, pinned persistently to the top of the Explore page.

## [1.0.0] - 2026-04-07

### Added
- **Initial Release:** Launched the first version of the IEEE Benefits platform — a centralized dashboard for IEEE members to discover and explore benefits, grants, competitions, and opportunities offered across IEEE's Organizational Units.
- **Core Features:** Implemented the full benefit exploration and filtering experience, including a searchable benefits grid with detailed Benefit Cards showing deadlines, eligibility, membership requirements, and category badges.
- **Organizations:** Populated a comprehensive directory of IEEE OUs including Committees, Societies, Technical Councils, and Geographic Units, each with official logos and an icon-based fallback system.
- **Home Dashboard:** Built the Home page with category browsing cards and an OU directory organized by committees, societies, and geographic units, with live benefit counts and "Coming Soon" states.
- **Onboarding & Personalization:** Introduced an onboarding modal allowing users to set their membership status, student/professional identity, regions of interest, and preferred categories to personalize their experience.
- **Favorites:** Added a Favorites system allowing users to save and revisit benefits, persisted across sessions via `localStorage`.
- **Navigation & Theme:** Built a responsive navigation bar with mobile menu support, dark/light theme toggle, and feature flags for Personalize and Contribute visibility.
- **Contribution Flow:** Implemented the Contribute page allowing community members to submit new benefits via a structured form.
- **Cloudflare Workers Backend:** Set up a Cloudflare Workers backend to serve benefits data, OU information, and category configuration via a dedicated API.
