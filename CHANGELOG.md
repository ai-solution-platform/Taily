# Taily - Change Log

All notable changes to this project will be documented in this file.
Format follows [Semantic Versioning](https://semver.org/).

---

## [v1.3.0] - 2026-03-10 (CURRENT)

### Fixed — Responsive / Cross-Browser (Group A)
- **A1**: Fixed `100vh` mobile viewport bug → uses `100dvh` + JS `--app-height` fallback + `-webkit-fill-available`
- **A2**: Added `viewport-fit=cover` to meta viewport tag → enables `env(safe-area-inset-*)` on iPhone
- **A3**: Fixed bottom nav bar hidden on iOS Safari/Chrome → proper safe-area padding, flex-shrink:0, reduced nav height 72px→60px
- **A4**: Fixed header safe-area for iPhone notch/Dynamic Island → flex-shrink:0, min-height instead of fixed height
- **A5**: Added mobile-first responsive CSS → breakpoints for <380px (small phones), <480px (standard mobile), iOS Safari `@supports` fix

### Improved — UX/UI (Group B)
- **B1**: Events page header reduced ~40% → compact padding, smaller fonts (h2: 24→20px), smaller search bar (44→38px), smaller filter chips, view tabs padding reduced
- **B2**: Merchant card placeholders now color-coded by category: restaurant (red), cafe (brown), hotel (blue), tourist (green) — applies to list cards, grid cards, popups, and detail hero
- **B3**: Floating elements (nearby btn, map stats) positioned closer to bottom nav with safe-area awareness

### Technical Changes
- Bottom sheet accounts for safe-area-inset-bottom
- Toast notification accounts for safe-area-inset-bottom
- Page content padding-bottom simplified (nav provides its own safe-area padding)
- Added `overscroll-behavior:none` to prevent iOS rubber-banding
- Added `-webkit-tap-highlight-color:transparent` for touch elements
- Viewport height JS fix runs on resize + orientationchange events

---

## [v1.2.0] - 2026-03-10 (Pre-fix baseline)
**Commit:** `753f54c`

### Fixed
- Reduced bottom sheet heights: half 42vh→36vh, full 80vh→55vh
- Improved grid view cards: added min-height, line-clamp, hide description
- Adjusted nearby-btn and map-stats z-index from 500→450, bottom 72px→64px
- Added auto-expand sheet to half state when findNearby() activates

### Known Issues (to be fixed in v1.3.0)
- A1: `100vh` causes nav bar to hide behind browser toolbar on iOS Safari/Chrome
- A2: Missing `viewport-fit=cover` — safe-area-inset returns 0 on iPhone
- A3: Bottom nav bar hidden/cut off on Safari (no labels) and Chrome
- A4: Header may be hidden on some mobile browsers (no safe-area-inset-top)
- A5: No mobile-first responsive CSS for screens < 480px
- B1: Events page header too large (~45% of screen)
- B2: Merchant card placeholders all look the same (orange gradient)
- B3: Floating elements (stats badge, nearby btn) look too "floating"

---

## [v1.1.0] - 2026-03-10
**Commit:** `636daa8`

### Added
- Bottom sheet with 3-state sliding (peek/half/full) + touch gestures
- Filter panel with category, price, rating, province filters
- 10 mock coupon cards with categories (discount/free/special)
- 6 profile sub-pages (favorites, history, pets, points, settings, help)
- Coupon tabs (all/discount/bonus/special)
- Profile menu items with navigation

### Fixed
- Filter panel scroll and layout issues
- Profile sub-page back button navigation bug

---

## [v1.0.0] - 2026-03-09
**Commit:** `2d17682`

### Added
- Initial Taily platform release
- Mobile app with map view (Leaflet.js + MarkerCluster)
- 2,000 pet-friendly merchants from Excel data
- 31 mock events for 2026 (BE 2569)
- 4 category markers: restaurant (red), cafe (brown), hotel (blue), tourist (green)
- Events page with list/gallery/calendar views
- Merchant detail pages with popup cards
- Admin back office
- Taily brand CI applied (#FFC501, #3D2B1F)
- GitHub Pages deployment

---

## Rollback Guide

To rollback to a specific version:
```bash
# View all versions
git tag -l

# Rollback to specific version
git checkout v1.2.0    # Pre-fix baseline
git checkout v1.1.0    # Before UX fixes
git checkout v1.0.0    # Initial release

# Or reset branch to a version (destructive)
git reset --hard v1.2.0
```
