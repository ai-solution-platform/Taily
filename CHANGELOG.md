# Taily - Change Log

All notable changes to this project will be documented in this file.
Format follows [Semantic Versioning](https://semver.org/).

---

## [v2.0.0] - 2026-03-11 (CURRENT) — Super App

### 🎉 Major Architecture Overhaul
Complete restructuring from 4-tab map-focused app to **5-tab Super App** prototype with comprehensive mock data, simulated backend, and production-quality UI.

### New Tab Structure
- **Home** — Stories bar, quick actions grid, social feed, nearby places carousel, featured merchants, upcoming events, deals preview
- **Explore** — Refactored map with 2,000 markers, category filters, bottom sheet, merchant detail, event list/gallery/calendar (migrated from v1.x)
- **Market** — Product grid, category filters, promo banners, product detail, shopping cart, checkout flow (3-step), order history, coupons
- **Social** — Following/Discover feed, Groups, Messages (DM chat), Pet Adoption listings
- **Me** — Profile with stats, Pet Profiles, Taily Wallet (points/tier), Pet Digital ID (QR), Health Records timeline, Notifications, Settings

### New Files Created
- **CSS** (split per-tab): `home.css`, `explore.css`, `market.css`, `social.css`, `me.css`
- **JS** (modular): `store.js` (pub-sub state), `mock-api.js` (simulated API), `home.js`, `explore.js`, `market.js`, `social.js`, `me.js`
- **Mock Data** (11 JSON files): `merchants.json` (2,000), `events.json` (31), `posts.json` (30), `stories.json` (12), `products.json` (50), `groups.json` (6), `messages.json` (3 chats), `adoption.json` (8 pets), `notifications.json` (15), `orders.json` (5), `user-profile.json` (1 user + 2 pets + wallet)

### New Features
- **Stories** — Instagram-like stories with gradient rings, full-screen viewer, 5s auto-advance, progress bar
- **Social Feed** — Pet photo posts with like/comment/share/bookmark, tier badges, hashtags, infinite scroll
- **Marketplace** — 50 products, 2-column grid, category pills, discount badges, star ratings, sold count
- **Shopping Cart** — Slide-up bottom sheet, quantity controls, subtotal, checkout with PromptPay/Card/COD
- **Chat/Messages** — Conversation list with unread badges, chat bubbles with timestamps
- **Pet Adoption** — Grid of pets with species badges, vaccination status, adoption detail page
- **Groups** — Community groups with cover images, member counts, join buttons
- **Taily Wallet** — Golden gradient card, 12,500 points, Gold tier progress to Platinum, transactions
- **Pet Digital ID** — Styled card with QR code (SVG), microchip ID, vaccination badges
- **Health Records** — Vertical timeline with colored dots, vaccination history, next reminders
- **Notifications** — Grouped by date, type-based icons, unread indicators
- **Global Search** — Overlay with merchant/product/event results
- **Hash Routing** — SPA navigation with `#home`, `#explore`, `#market`, `#social`, `#me`
- **State Management** — `TailyStore` pub-sub with localStorage persistence for cart, likes, bookmarks, viewed stories

### Admin Panel Updates
- 4 new management sections: Products, Orders, Social Content, Adoption
- 4 new dashboard stat cards: Product Sales (฿847,320), Active Orders (156), Social Posts (1,247), Adoptions (34)
- Products table with category filters, images, prices, discounts, stock, sales
- Orders table with status badges (color-coded), filter tabs
- Social moderation with approve/flag/delete actions
- Adoption management with pet listing table

### Phase 8 Polish
- Skeleton loading animation system (shimmer effect) for feed, stories, products, cards
- Page transition animations (fadeIn, slideInRight, slideInUp, scaleIn, popIn)
- Staggered card entrance animations
- Empty state components with icons/emoji
- Pull-to-refresh spinner
- Card press/touch feedback (scale 0.97)
- Heart burst animation for likes
- Notification badge pulse
- Scroll position restoration per tab
- Image lazy-load observer with fade-in
- Progress bar fill animation

### Fixed (during QA)
- **Conversation list styling**: CSS `.convo-*` class mismatch with JS `.conversation-*` — added compatibility aliases
- **Health timeline styling**: CSS `.ht-*` mismatch with JS `.health-timeline-*` — added compatibility aliases
- **Product detail buttons hidden**: `.pd-actions` `bottom: 0` → `bottom: calc(var(--nav-height) + var(--safe-bottom))`
- **Comment input hidden**: Same bottom positioning fix for `.post-detail-comment-input`

### Technical
- Vanilla HTML/CSS/JS — zero build tools, direct GitHub Pages deploy
- Unsplash URLs for realistic pet/product images + ui-avatars.com for user avatars
- MockAPI with simulated 200-800ms async delays for realistic loading
- CSS custom properties for consistent theming across all tabs
- Font Awesome 6 icons throughout
- IBM Plex Sans Thai + Inter font stack
- iOS safe area support (`env(safe-area-inset-*)`)
- Max-width 430px mobile viewport

---

## [v1.3.1] - 2026-03-10

### Fixed — Floating Elements Positioning (B3 follow-up)
- **Root cause**: `.bottom-sheet`, `.map-stats`, `.nearby-btn` used `bottom: calc(var(--nav-height) + var(--safe-bottom))` but they're inside `.page` which already ends at the nav bar top — causing ~94px unwanted gap
- **Bottom sheet**: Changed from `bottom: calc(nav + safe)` → `bottom: 0` (flush with nav bar)
- **Map stats & Nearby btn**: Changed from `bottom: calc(nav + safe + 54px)` → `bottom: 62px` (just above sheet peek)
- **Leaflet zoom controls**: Added `.leaflet-bottom.leaflet-right { bottom: 100px }` to push above floating elements

---

## [v1.3.0] - 2026-03-10

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
