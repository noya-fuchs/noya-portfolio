---
name: portfolio-design
description: Build or restyle a personal portfolio site in the "Noya Fuchs" design: warm grey/paper/ink palette, one light-lilac accent, Inter Tight display type, 28px rounded cards, hero with giant name behind a cut-out portrait, sticky stacked experience cards, floating bottom dock, GSAP + Lenis scroll motion. Use when the user asks for a portfolio, personal site, CV site or "the same design as before" for a new person or new content.
---

# Portfolio design system (Noya Fuchs portfolio)

Static site, no build step: `index.html` + `css/styles.css` + `js/*.js` + vendored GSAP, ScrollTrigger, Lenis.
Reference implementation: the repo root of noya-portfolio. Starter files are bundled in this skill's `assets/`.

## How to use
1. Copy `assets/css/styles.css`, `assets/js/*` into the new project (`css/`, `js/`); copy `assets/vendor/*` (gsap, ScrollTrigger, lenis) to `vendor/`.
2. Start from `assets/index.template.html`, replace every `{{PLACEHOLDER}}`, keep class names and `data-*` hooks (the JS depends on them).
3. Only change content and the `:root` tokens. Re-theme by editing tokens, not component rules.
4. Contact details live in `js/config.js` (`data-config="email|phone|instagram"` hooks). Instagram feed is optional (`feedUrl` empty = designed gradient tiles).
5. Images: WebP, set `width`/`height`, `loading="lazy"` except the hero photo (`fetchpriority="high"`). Hero portrait must be a transparent cut-out (`portrait-cutout.webp`, ~848x1400). Also ship `og.jpg` and `favicon.png`.
6. Verify at 1440px, 900px, 390px, and a landscape phone; check reduced-motion (`?reduce=1`) and no-JS readability.

## Design tokens (`:root`)
| Token | Value | Use |
|---|---|---|
| `--bg` | #E6E5E1 | page background |
| `--card` | #D7D6D2 | grey cards, hero |
| `--paper` | #F3F2EE | light cards, dock |
| `--ink` | #161615 | text, dark contact card |
| `--muted` | #5B5A56 | secondary text, labels |
| `--accent` | #C9B1F2 | pills, dates, active dock, Impact buttons (the ONLY accent). Text on it is ink (`--accent-ink` #161615) |
| `--accent-soft` | #E4D8FA | marker highlight behind dark text |
| `--accent-on-dark` | #CDB6F6 | accent on ink |
| `--sage` #DFE6C9, `--sky-1/2` #B9D6F2/#E7F1FB, `--navy` #14305C | one-off feature cards (sage = personal venture, sky+navy = featured role) |

Fonts: display `Inter Tight` (300 for headlines, 400-500 for titles), body `Inter`. Headlines use `.display`: weight 300, letter-spacing -0.045em, line-height 0.95, `text-wrap: balance`. Labels: 12px, 600, uppercase, 0.12em tracking, with a 22px leading rule (`.label`).

## Rules of the look
- Everything is a big rounded card (radius 28px; images 14-20px; pills 999px). Generous vertical rhythm: `clamp(70px, 10vw, 140px)` between sections.
- Grey, paper and ink do the work; lilac appears only in pills, dates, highlights, active nav. Do not add a second accent. Feature cards (sage, sky) are the only extra colours.
- Large light-weight type with tight tracking; section headlines `clamp(2.4rem, 6.2vw, 6rem)`.
- Highlighted phrase in hero title = `<em>` with lilac pill background and `box-decoration-break: clone`.
- Bullets: 8px round dots (ink on light cards, `--accent-on-dark` on dark).
- Chips: 12.5px, 1px currentColor border, pill shape.
- Layout container: `.wrap` (safe-area-aware gutters) + `.inner` (max 1320px).
- Respect safe-area insets (notch, home indicator); body has a `::before` cover for the top inset.
- Copy tone: short, concrete, first-person, no filler.

## Section recipes (in page order)
1. **Top bar**: fixed, blurred, slides in once the hero card leaves view (name + Contact pill).
2. **Dock**: fixed bottom pill nav, blurred paper, active item lilac; scrolls horizontally on phones.
3. **Hero** (`.hero__card`, height min(100svh-24px, 900px)): `.hero__name` giant two-word name behind (z1), `.hero__photo` cut-out in front (z2, grayscale by default), `.hero__title` bottom-left, `.hero__meta` bottom-right, "Scroll down" nudge bottom-left. Under 900px: name stacks, title moves below card (`.hero__titleMobile`). Landscape phones keep the desktop composition.
4. **Statement**: one huge sentence, words fade from 0.14 to 1 on scroll, one word with lilac marker (`.hl`), muted subline with a bold proof point.
5. **Work stack**: `.xcard` two-column (meta | bullets). Alternate `--grey` / `--paper`. Date as lilac pill, skill chips, optional photos or logo watermark (`.xcard__bg`). Each card is its own floating panel (no sticky stacking).
6. **Featured role** (`.impact__card`): sky radial-gradient card, navy text, date pill navy, sticky social-feed column (`.feed`, tiles auto-scroll with the section on desktop; horizontal snap on phones).
7. **Personal venture** (`.yoga__card`): sage card, big headline, chips, two photo rows (`.yrow--a` 1.6/1/1, `--b` 3 equal); rows become snap carousels on phones. `.ph` is the striped placeholder.
8. **Roots** (`.rcard` paper cards, 2 columns) + `.camp-strip` 3-photo strip with caption.
9. **About**: three `.acard` columns with a top ink rule (Education / Certificate / Tools chips).
10. **Contact**: ink card, huge "Let's *talk.*" (accent word), `.crow` rows with a Copy button each.

Drop sections that do not apply; keep the hero, work stack, about and contact as the minimum.

## Motion (js/app.js)
- Libraries optional: if GSAP/ScrollTrigger missing or reduced motion, the page is fully usable.
- Hero entrance: "first name" slides in from the left, "last name" from the right, portrait rises from the bottom (yPercent 40 → 0), then title/meta; scroll scrub: name drifts up 16%, photo scales 1.07, title/meta fade.
- `[data-reveal]`: y 38 → 0, fade, once at top 90%. `[data-stagger]`: children stagger 0.12.
- Lenis smooth scroll (lerp 0.11) with a native-scroll safety net for nav clicks. Nav sets focus on the section and updates the hash.
- IntersectionObserver drives the active dock item (`SECTION_TO_DOCK` map: add every new section id) and the top bar.
- Floating panels (all devices): hero card, statement, each card and section block ease in from scale 0.88 / opacity ~0 / 70px lower to rest as they rise into view, and ease out to scale 0.93 / opacity 0.28 as they leave, so one block holds the screen at a time. Implemented in `js/app.js` with a GSAP ticker that damps values every frame and reads layout positions (offsetTop), never the transformed rect. List the panel selectors in `PANEL_SELECTORS`.
- Feed drift only inside `matchMedia("(min-width: 900px) and (min-height: 760px)")`.

## Accessibility and quality bar
`:focus-visible` rings, hidden top bar not tabbable (`visibility`), meaningful alt text, `aria-label` on the h1 name and nav, `data-lenis-prevent` on inner scrollers, `prefers-reduced-motion` honoured, readable with JS off, no horizontal overflow at 320px.

## Adapting checklist
- [ ] Tokens kept (change only if the user asks for a new palette)
- [ ] All `{{PLACEHOLDER}}`s replaced, no leftover personal data from the original
- [ ] `SECTION_TO_DOCK` and dock links match the section ids
- [ ] Cut-out portrait, og.jpg, favicon provided
- [ ] Tested at desktop, tablet, phone, landscape, reduced motion
