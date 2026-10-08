# FamilyStream Design: Research & System

This doc covers what makes media apps feel premium, how FamilyStream applies it, and the brand/design system that resulted. Read it before adding screens so new work stays consistent.

---

## 1. Research: what the best media apps do

### Netflix (the main reference)
- **Content is the interface.** Netflix's chrome is almost entirely black and white so artwork carries the color. Commentary on its design keeps returning to dark backgrounds, quiet layouts and adaptive thumbnails as the reason it feels cinematic.
- **The billboard.** Home opens with one huge spotlight title. After a beat it starts a muted preview, shrinks the synopsis away, and shows a mute toggle. The 2025 TV redesign made this banner even bigger and more central.
- **Rows, not grids.** Horizontal rows are each a "reason to watch" (Continue Watching, My List, New, a genre). Row titles link to "Explore all". Tiles bleed past the screen edge to show there's more.
- **Labels on tiles.** The 2025 redesign put context on tiles before you open them: "New Season", "#1 in TV Shows", "Recently Added". Tiles carry the title and status, not just a picture.
- **Artwork is personalized.** Netflix tests several artworks per title and picks per viewer, measuring "take rate". The lesson for us is that the *thumbnail is the product*, so pick and frame it well.
- **Low-friction resume.** Continue Watching sits near the top, and playback resumes automatically. Exiting is more effort than continuing.
- **Mobile is its own design.** Bottom tab bar, a centered poster-style billboard card, and swipeable rows. Netflix's 2026 mobile overhaul added a vertical "Clips" feed for faster discovery.
- **The "ta-dum".** A short brand moment on launch makes the app feel like an *event*.

### Apple Photos (iOS 18) and Google Photos
- **Resurfacing memories** is the most-loved feature in both, e.g. "On this day" and auto-played Memories strips. Reviewers liked having forgotten photos brought back.
- **Users want control of the layout.** iOS 18 lets people reorder and hide collections. Critics of the redesign said the same photo showing up in several overlapping sections made things feel cluttered.
- **Search must be fast and forgiving.** Natural-language search ("dog at the beach") and quick month/year filters were the most-praised discovery tools.

### Plex / Jellyfin / Infuse (self-hosted media)
- Plex is consistently called the more polished experience, and Infuse is the "premium player" people put *on top of* Jellyfin/Plex for its big artwork tiles. Polish, not features, is what separates them.
- The takeaway for a self-hosted app: generous artwork, smooth motion and native-feeling navigation do more for perceived quality than more settings.

### iOS icon and PWA conventions
- iOS 26 icons are layered and rendered with the Liquid Glass material (specular highlights, depth). An icon that looks flat and dated next to them hurts "real app" credibility.
- For home-screen web apps, iOS uses `apple-touch-icon`. It must be an **opaque, full-bleed square** (iOS applies its own rounded mask), ideally 180×180. Web clips don't get the native dark/tinted variants, so the icon should work as-is on any wallpaper.

---

## 2. Principles we adopted

1. **Artwork first, chrome last.** Neutral near-black (`#030308`) surfaces, white type, and one accent. Color comes from your photos and videos.
2. **Every row is a reason.** Rows are named for intent: Continue Watching, New This Week, My List, On This Day. Avoid duplicate rows that repeat the same items without a reason.
3. **One motion curve.** Everything uses `cubic-bezier(0.16, 1, 0.3, 1)` (`ease-cinema` in Tailwind): a fast start with a long, soft landing. Respect `prefers-reduced-motion` everywhere.
4. **Native on mobile.** Bottom tab bar, safe areas, swipe gestures, autofill-friendly forms, 44pt+ touch targets.
5. **Never a blank screen.** Shimmer skeletons in the shape of the real layout instead of spinners.

---

## 3. What changed in this pass

| Area | Before | After |
|---|---|---|
| **Logo** | Lucide clapperboard icon + Bebas text | Custom "F + play" ribbon monogram and a two-tone wordmark (`components/Logo.jsx`) |
| **App icon** | Flat gradient triangle | Layered mark on a deep violet field with a center glow and a glass rim highlight. Full set: 152/167/180 touch icons, 192/512 PWA, SVG + ICO favicons |
| **Launch** | none | Brand splash ("ta-dum"), once per session (`components/Splash.jsx`) |
| **Billboard** | One random item, static | Rotates through 5 picks with Ken Burns motion. Muted video preview on desktop (synopsis collapses, mute toggle). Metadata row, My List button, bottom-sheet details. On mobile, a swipeable poster card over an ambient glow of its own artwork |
| **Rows** | Plain scroller | Snap scrolling, edge-bleed gutter, paddles only when scrollable, "Explore all ›" deep links |
| **Tiles** | Image + caption below | Title inside the art on a scrim, "New" badge (≤7 days), duration, progress bar, hover lift + play affordance, fade-in on load |
| **Continue Watching** | Progress saved but never read | New row and auto-resume on Watch. Position is also saved on pause/exit (new `GET /media/profile/continue-watching`, `GET /media/:id/progress`) |
| **My List** | Favorites row only | One-tap add/remove from the billboard (optimistic) |
| **Navigation** | Row of 7 icon buttons | Desktop: text links with an animated underline, Upload pill, profile menu. Mobile: frosted bottom tab bar |
| **Browse/Search** | Native `<select>`s | Filters in the URL (`?type=`, `?category=`), pill chips, skeleton and empty states |
| **Profiles / Login** | Plain | "Who's watching?" with lit avatars. Aurora backdrop and glass card on login, Keychain autofill hints |
| **Theme** | Indigo default | New **Aurora** default that matches the logo. Existing per-profile theme choices are kept |

---

## 4. Design system

### Brand
- **Mark:** an "F" whose middle arm is a play button, built like a folded ribbon (the arms tuck under the stem with a fold shadow). It reads as *Family* and *Stream* at once. The source of truth is `public/brand/app-icon.svg`, a 100-unit grid shared with `LogoMark`.
- **Brand colors (fixed, not themeable):** Stem `#B7A8FF → #5B3DF5`, arms `#7A5CFF → #C9BCFF`, play `#FF9A6B → #FF3D8B`.
- **Wordmark:** "Family" in white + "Stream" in the brand gradient, Inter Tight semibold, tight tracking.

### Color tokens
- Surfaces: `base-950 #030308` (page), `base-900`, `base-800`, `base-700`.
- Accent: `accent`, `accent-dim`, `accent-glow`, driven by CSS variables so each profile's theme swaps at runtime.
- Text: white at 100 / 80 / 60 / 45% opacity for the hierarchy.

### Type
- **Display:** Inter Tight 700–800, `tracking-tight`. Titles, row headers, wordmark.
- **UI:** Inter 400–600.
- Billboard titles: 60–72px desktop, 30px mobile. Row headers: 18–20px.

### Surfaces and utilities (`index.css`)
- `.glass`: frosted surface for the nav, menus, tab bar and sheets.
- `.skeleton`: shimmer placeholder.
- `.has-tabbar`: reserves bottom-tab space on mobile (set automatically by `Navbar`).

### Icon export
To regenerate icons after editing `public/brand/app-icon.svg`, render it to opaque PNGs at 180, 167, 152, 192 and 512. Any headless browser works (e.g. Playwright `page.screenshot`). Keep the mark inside the central ~80% so it survives maskable/Android cropping.

---

## 5. Next ideas (not built yet)

- **Hover-expand preview cards** on desktop: the tile grows into a mini card with a muted clip and action buttons.
- **Trickplay thumbnails** on the seek bar (ffmpeg sprite sheet at transcode time).
- **Real artwork choice:** let owners pick a thumbnail frame, or auto-pick the sharpest/most-faces frame, Netflix "artwork" style.
- **Reorder/hide rows** per profile, which iOS 18 Photos users valued.
- **Clips-style vertical feed** of short moments for phones.
- **Natural-language search** ("grandma at the beach").
- **Top 10 row** once per-item view counts are tracked.
- **Skip intro / up next** autoplay in the player.

---

## Sources
- [Netflix is making a massive design change (Tom's Guide)](https://tomsguide.com/entertainment/netflix/netflix-is-making-a-massive-change-to-its-homepage-for-the-first-time-in-years)
- [Netflix launches first redesign since 2014 (DesignRush)](https://news.designrush.com/netflix-launches-first-redesign-since-2014)
- [Netflix testing new design on TV (Mezha)](https://mezha.ua/en/news/netflix-testing-new-design-on-tv-301261/)
- [Netflix personalises artwork to viewing habits (It's Nice That)](https://www.itsnicethat.com/news/netflix-personalises-artwork-to-viewing-habits-181217)
- [Next Episode: the design patterns and flows of Netflix (UX Planet)](https://uxplanet.org/next-episode-the-design-patterns-and-flows-of-netflix-592b63741f89)
- [What Netflix artwork personalization can teach UI design (Thrive)](https://thriveagency.com/news/what-netflix-artwork-personalization-can-teach-us-about-ui-web-design/)
- [iOS 18 Photos redesign delivers a better experience (Tom's Guide)](https://www.tomsguide.com/phones/iphones/its-time-to-admit-it-the-photos-app-redesign-in-ios-18-delivers-a-better-experience)
- [iOS and iPadOS 18: The MacStories Review](https://www.macstories.net/stories/ios-and-ipados-18-the-macstories-review/9)
- [Hands on: everything new with Photos in iOS 18 (AppleInsider)](https://appleinsider.com/articles/24/08/30/hands-on-everything-new-with-photos-in-ios-18)
- [Plex vs Jellyfin (Xataka On)](https://www.xatakaon.com/basics/plex-vs-jellyfin-comparison-differences-and-which-one-to-buy)
- [Jellyfin vs Plex (Firecore community)](https://community.firecore.com/t/jellyfin-vs-plex/54942)
- [iOS 26: The Home Screen and App Icons (MacStories)](https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/4)
- [Apple Liquid Glass design (MobileAction)](https://www.mobileaction.co/blog/apple-liquid-glass-design/)
- [Add an Apple touch icon to your PWA (web.dev)](https://web.dev/codelab-apple-touch-icon)
