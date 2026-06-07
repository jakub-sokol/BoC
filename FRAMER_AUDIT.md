# Framer Residue Audit — Business of Competition site

> Audit only. No site code is changed by this document. It is written as an
> ordered de-Framerization roadmap so the cleanup can be executed later in safe
> phases. Highest-value immediate fix, if you want one quick win: **Group J**.

## Context

The site (`index.html`, `bocomp26.html`, `bocomp27.html`, plus `contact-us`,
`privacy-policy`, `terms-and-conditions`) was exported from the Framer "Omega –
Portfolio & Agency Template" and is now hand-edited as a static site, deployed on
Vercel (`vercel.json` rewrites `/:path*` → `index.html`, `/bocomp26` →
`bocomp26.html`).

The recurring class of bugs ("residual nonfunctional Framer code") has one root
cause: **every page still ships and runs the full Framer React runtime**, which
hydrates the server-rendered DOM and continuously re-renders it. Hand-written
content and fixes are bolted on top via `MutationObserver`s, `setInterval`
polling, and `setTimeout`s that race the runtime and overwrite its output. This
is fragile by construction and has already caused a Safari hang (documented in
`index.html:304-306`) and gallery/caching breakage (git history: "move gallery
outside Framer DOM", "Fix Safari gallery caching").

---

## Executive summary

| # | Group | Severity | One-line impact |
|---|-------|----------|-----------------|
| A | Template metadata ("Omega") | High (SEO/brand) | Wrong `<title>`/OG on 5 of 6 pages |
| B | Framer React runtime (`js/*.mjs`) | **Critical** | The engine that re-renders over our edits |
| C | Inline hydration payload | Critical | Feeds the runtime; bulk of page weight |
| D | SPA router residue | High | Forces "bypass Framer router" link hacks |
| E | CMS machinery (`*.framercms`) | Medium | Dead data for deleted /works + /blog |
| F | Search index | Medium | Ships template content to crawlers |
| G | Hidden dead Framer sections | High | In DOM + hydrated, only CSS-hidden |
| H | Icon / font module loaders | Low | Duplicated, partly unused |
| I | Runtime-fighting custom code | High (symptom) | 40+ observers/timers that exist only to fight B |
| J | Live SyntaxError bug | **Critical** | Curly quotes break a whole script block |
| K | Stale / backup files | Low | `.bak`, `.DS_Store`, template images |

Removal dependency order: **J → A/F/K (free wins) → G → E/D → B/C/H → I collapses
automatically.** Group I cannot be removed until B is gone; conversely most of I
disappears the moment B is removed.

---

## Detailed findings

### A. Template metadata residue ("Omega") — High (SEO/brand)
- `<title>Omega - Portfolio &amp; Agency Template for Framer</title>` on **5 of 6
  pages**: `index.html`, `bocomp26.html`, `contact-us.html`,
  `privacy-policy.html`, `terms-and-conditions.html`. (`bocomp27.html` already
  fixed — use it as the template.)
- `meta name="description"`, `og:title`, `og:description`, `og:image`,
  `twitter:title/description/card` all describe the Omega template (head of each
  file, ~lines 18–35 in `index.html`).
- `<meta name="generator" content="Framer 3be6e9d">`.
- `<!-- Made in Framer · framer.com ✨ -->` / `<!-- Published … -->` comments at
  top of every file.
- Favicon + `apple-touch-icon` point at template images
  (`images/atv4soethwqm06m3jp5rjcih0e-1.png`, `images/app-icon.png`).

**Action:** rewrite per-page `<title>`/meta/OG to BoC content; drop `generator`
meta and Framer comments; replace icons. **Risk:** none.

### B. Framer React runtime — Critical (root cause)
Loaded on **every page** (1 `data-framer-bundle` per file; 6–17
`rel="modulepreload"` per file).

- Entry bundle: `js/script_main.bsg5_ml6.mjs`
  (`<script type="module" … data-framer-bundle="main">`, end of `<body>`).
- Core libs (modulepreloaded in `<head>`): `react.uzzkdtas.mjs`,
  `rolldown-runtime.bb3s47xo.mjs`, `motion.ct-z6yxm.mjs`, `framer.czxg359l.mjs`,
  `shared-lib.odmxqlii.mjs`, `init.mjs`.
- Per-route/per-component hashed chunks (e.g. `c6ajg4zke.oaoaioek.mjs` = index
  route, plus ~15 anonymous-hash `.mjs` per page).
- `slideshow.bkw6xyaa.mjs` (gallery/slideshow — already replaced by custom JSON
  carousel on bocomp26, so likely dead there).

**Why it's the problem:** it reconciles the live DOM against the original
template's virtual DOM and overwrites hand edits — which is why each custom edit
needs an observer to re-apply itself.

**Action:** delete the `script_main` module tag + all `modulepreload` links —
*after* re-implementing features that genuinely need JS (mobile nav toggle,
scroll-in animations if wanted). **Risk:** high — inventory live behaviours first
(see "What the runtime currently powers").

### C. Inline hydration payload — Critical (feeds B)
- `<div id="main" data-framer-hydrate-v2="{…large JSON…}">` (one per page,
  `index.html:269`).
- `<script type="framer/appear" id="__framer__appearAnimationsContent">` and
  `__framer__breakpoints`.
- Framer bootstrap inline scripts at top of `<body>` (e.g. `index.html:269-277`):
  link-rewriter `u()`, `framer_variant` cookie/URL handler, `animator` IIFE,
  `window.process.env.NODE_ENV` shim, `Date.prototype.toLocaleString` override.
- DOM attributes throughout: `data-framer-name` (~225–237/page),
  `data-framer-component` (~300–362/page), `data-framer-appear-id`,
  `framer-XXXX` utility classes.

**Action:** remove with B. `data-framer-*` attrs / `framer-…` classes may stay if
styling depends on them, but drop the `data-framer-hydrate-v2` blob and
`framer/appear` scripts. **Risk:** medium — appear animations stop unless
reimplemented in CSS.

### D. SPA router residue — High
- `<script src="js/rerouter.js"></script>` in `<head>` of every page (exflow URL
  mapping, SHA-1 hashing, spoofs `navigator.connection` saveData).
- `js/back_button_override.culx5urb.mjs`.
- Symptom: `index.html:317-334` rewrites the BoC-2026 card `href` and
  hard-`window.location`s to escape the router; `index.html:390-398` adds a
  delegated click handler for the bocomp27 card for the same reason.

**Action:** remove `rerouter.js` + `back_button_override`; then plain `<a href>`
works and the bypass hacks (Group I) can go. **Risk:** medium — verify no
intra-site link depends on router rewrites.

### E. CMS machinery — Medium (fully unused)
Data + query engine for the template's `/works` and `/blog` collections, neither
of which exists anymore.

- `js/q3fzxxpza.js`, `js/q3fzxxpza.bteghf-6.mjs`,
  `js/q3fzxxpza-chunk-default-0.framercms`,
  `js/q3fzxxpza-indexes-default-0.framercms`.
- `js/rb5yv6ba1.js`, `js/rb5yv6ba1.z7wxvnag.mjs`,
  `js/rb5yv6ba1-chunk-default-0.framercms`,
  `js/rb5yv6ba1-indexes-default-0.framercms`.

**Action:** deletable (only referenced via the runtime B). **Risk:** low once B
is removed.

### F. Search index — Medium
- `<meta name="framer-search-index" content="js/searchindex-5wnb3tkfyqbw.json">`
  on every page.
- `js/searchindex-5wnb3tkfyqbw.json` — full of template content
  (`"Sahara Desert - Omega"`, `/works/*` routes, Omega descriptions).

**Action:** remove the meta tag and the JSON file (no real search UI exists).
**Risk:** none.

### G. Hidden dead Framer-native sections — High
Whole template sections still in the DOM and **still hydrated by React**, merely
`display:none`-d via injected `<style>`.

In `bocomp26.html` (`<style>` at lines 382-409):
- `section#services.framer-12klq0p`, `div.framer-n5jhpg`,
  `section#works.framer-16xti0c`, `section#services-1.framer-ozxytt`,
  `section#blog.framer-k0pqez`, `div.framer-twcsvs`, `div.framer-12ow6ey`
- `[data-framer-name="Event Gallery"]`,
  `[data-framer-name="Testimonial Highlight Section"]` (replaced by custom)
- `div.framer-1f29gs` (old sponsor logo ticker — replaced by custom marquee)
- noise/grain canvas overlay `.framer-gh39l9-container canvas[aria-hidden]`
- venue text `div.framer-v0p9p`, `div.framer-18np4au`; schedule tagline
  `div.framer-kslewa`, `div.framer-1aux6zn`

In `index.html` (`<style>` at line 382): `div.framer-12ow6ey`,
`div.framer-1er299b-container`.

**Action:** physically delete these subtrees (not just hide); then the matching
`display:none` rules and observers go too. **Risk:** medium — confirm each hidden
node is truly unused; do it section by section with the runtime still present and
verify visually.

### H. Icon / font module loaders — Low
- Icon modules, several duplicated as versioned copies:
  `arrowupright.js`/`arrowcircleupright.js`/`handshake.js`/`intersect.js`/
  `magnifyingglass.js`/`star.js` **and** `framer-module-*.js-0.0.57` twins, plus
  `phosphor.e4x07sgf.mjs`.
- Font modules: `fontshare-*.mjs` (×3), `framer-font-45ai7ucz…mjs`, `google-*.mjs`
  (×3). 17 root `*.woff2`; not all referenced by the fonts in use (Erode, DM
  Sans).

**Action:** after B, audit which woff2 the surviving `@font-face` rules use; drop
the rest + all icon/font loader modules. **Risk:** low — verify fonts render.

### I. Runtime-fighting custom code — High (symptom of B)
Exists **only** because of B and is itself a bug source. Counts: `index.html` = 4
`MutationObserver`, 2 `setInterval`, 5 `setTimeout`; `bocomp26.html` = 3
`MutationObserver`, 11 `setInterval`, 26 `setTimeout`.

Representative blocks in `index.html`:
- `285-315` disable-sweep hover hack (with documented Safari-hang mitigation).
- `317-334` BoC-2026 link router-bypass.
- `336-361` inject LinkedIn icon after React renders.
- `363-381` re-inject BoC logo mark after React renders.
- `383-405` relabel CTA / testimonials / bocomp27 link (also Group J).

**Action:** once B/C/D/G are gone, these collapse to one-time static DOM / plain
HTML and can be deleted. **Risk:** low after B; high if removed before B (edits
revert).

### J. Live SyntaxError bug — Critical (fix independently, now)
`index.html:383-405` uses **curly quotes** (`‘ ’`) instead of `'` on lines
**387, 388, 392, 393, 396** (e.g.
`document.querySelectorAll(‘section#testimonials …’)`). This throws a parse-time
`SyntaxError`, so the **entire IIFE never runs**, silently breaking:
- the "Contact us" → "Explore conferences" CTA relabel (line 386),
- the testimonials subheading text update,
- the delegated `/bocomp27` card click handler.

(Confirmed via byte inspection; other curly-quote hits — `index.html:269`,
`bocomp26.html:247/1787`, `bocomp27.html:247/810` — are inside string literals or
Framer bootstrap and are harmless.)

**Action:** replace the 5 curly quotes with straight quotes. **Risk:** none.

### K. Stale / backup files — Low
- `bocomp26.html.bak` (untracked), `.DS_Store` (root + `speakers/`), untracked
  candidate speaker images in `speakers/`.
- Template hero/portfolio images at repo root (random Framer-hash `*.jpg/png`) —
  many likely unreferenced after content swap.

**Action:** delete `.bak`/`.DS_Store`, add to `.gitignore`; after B/E removal,
run a reference sweep for orphan images. **Risk:** low — verify no `src`/`url()`
references before deleting any image.

---

## What the runtime currently powers (must reimplement before removing B)

- **Mobile nav / hamburger menu** — Framer renders desktop/mobile `<nav>` variants
  (`ssr-variant hidden-twin75` etc.); the toggle is runtime-driven.
- **Scroll/appear animations** — `framer/appear` + motion.mjs. Replaceable with
  CSS `@keyframes` + `IntersectionObserver` if wanted.
- **Slideshow** — already replaced on bocomp26 by the custom JSON carousel; verify
  index before deleting `slideshow.bkw6xyaa.mjs`.
- **Any hover/interaction states** baked into Framer components.

---

## Recommended de-Framerization order

1. **J** — fix curly-quote SyntaxError (independent, do now).
2. **A, F, K** — metadata, search index, stale files (free, no runtime risk).
3. **G** — physically delete hidden dead sections (one at a time, verify).
4. **Reimplement** mobile nav + any wanted animations as static HTML/CSS/JS.
5. **B, C, D** — remove runtime entry, modulepreloads, hydration blob,
   `framer/appear`, bootstrap inline scripts, `rerouter.js`,
   `back_button_override`.
6. **I** — delete now-redundant observers/polling/timeouts; convert effects to
   static markup.
7. **E, H** — delete CMS `.framercms`/cms-js and unused icon/font modules + orphan
   woff2.
8. Final reference sweep for orphan images/assets.

---

## Verification (per phase, since site is static)

- Serve locally (`python3 -m http.server` in repo root) and load `/`,
  `/bocomp26`, `/bocomp27`, `/contact-us`, `/privacy-policy`,
  `/terms-and-conditions`.
- Use the `preview_*` MCP tools: `preview_console_logs` (error-free — especially
  after Group J and after Group B removal), `preview_snapshot` (content intact),
  `preview_screenshot` (visual parity), `preview_resize` (mobile nav + responsive
  grids).
- Cross-browser check Safari/WebKit specifically (prior hang + caching bugs were
  Safari-only).
- After each deletion phase: `git diff` + reload to confirm no regression before
  proceeding.

---

## De-Framerization execution status (branch: `deframerize`)

Done page-by-page with per-phase browser verification (console clean, content
intact, mobile menu + nav variants working, no duplication).

### Completed & verified
- **J** — curly-quote SyntaxError fixed (index.html).
- **A/F/K** — all 6 pages: Omega title/meta/OG → real content; removed
  generator/search-index/framer comments; deleted search-index JSON, `.bak`,
  `.DS_Store`; gitignore updated. (Note: placeholder "Omega" testimonial copy
  in page bodies left for you to replace with real testimonials.)
- **B/C/D + reimplement + I** — **index.html, bocomp26.html, bocomp27.html**:
  removed React runtime (main bundle + modulepreloads), hydration payload,
  framer/appear + all bootstrap inline scripts, rerouter; stripped appear-initial
  opacity:0 states; added `js/boc-static.js` + `boc-static.css` (vanilla mobile
  menu; nav breakpoints already CSS-driven); deleted redundant logo-inject;
  consolidated observer/polling scripts into run-once handlers.
- **G (index)** — removed template Blog section + empty CMS marquee gap.
- **G (bocomp26)** — template Services/Works/Blog/etc. were runtime-rendered and
  vanished automatically with the runtime (never in SSR). Date corrected to 9–10
  April 2026.

### Remaining (blocked or optional)
- **Utility pages (contact-us, privacy-policy, terms-and-conditions)** —
  *blocked*: these are fully client-rendered (empty SSR `#main`); removing the
  runtime blanks them. They need a static rebuild — the contact form needs a
  form backend (Formspree/Basin/etc.) and the legal pages need their text frozen
  to static. Metadata `<title>` is fixed in HTML, but the runtime overrides the
  browser-tab title until it's removed. Currently left on the runtime.
- **E/H (delete js/*.mjs runtime + *.framercms CMS + unused fonts/icons)** —
  *blocked by the above*: those files are still loaded by the 3 utility pages.
  Delete only after the utility pages are rebuilt.
- **bocomp26 inert hidden elements** (Framer-native Event Gallery, Testimonial
  Highlight, old logo ticker, venue/tagline text) — still in SSR but
  `display:none` and now inert (no runtime). Optional byte-cleanup; reliable
  removal from the minified HTML proved risky, so left in place.
