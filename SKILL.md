---
name: randomcodespace-design
description: Use this skill to generate well-branded interfaces and assets for RandomCodeSpace (RCS), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping open-source, self-hostable dev tools.
user-invocable: true
---

# RandomCodeSpace Design Skill

Read the `README.md` file within this skill to understand the brand context, content fundamentals, visual foundations, and iconography rules.

Explore the other available files:

- **`colors_and_type.css`** — drop-in design tokens (colors, type, spacing, motion, radii, shadows). Light + dark + system themes.
- **`assets/`** — logos, logomark, wordmark. Copy what you need.
- **`preview/`** — design-system cards, one per concept. Good reference for what "on-brand" looks like.
- **`ui_kits/marketing/`** — marketing site components (hero, feature grid, nav, footer, pricing).
- **`ui_kits/app/`** — self-hosted dashboard components (sidebar, service cards, logs, settings).
- **`ui_kits/docs/`** — docs site components (sidebar nav, article, code blocks, callouts).

## When invoked

- If creating visual artifacts (slides, mocks, throwaway prototypes, static HTML), **copy assets out** and build static HTML files for the user to view.
- If working on production code, **copy assets and tokens in**, then follow the rules in `README.md` to design with this brand.
- If invoked without further guidance, ask the user what they want to build, ask a few targeted questions, and act as an expert RCS designer.

## Non-negotiables (from `README.md`)

- **Voice:** declarative, technical, no hype. Sentence case. No emoji. No exclamation marks.
- **Color:** pure monochrome — black / white / cool grays. Accent is the inverse of the surface (`#0B0B0F` on light, `#F5F5F7` on dark). No chroma except functional semantic colors.
- **Type:** Bricolage Grotesque (display, opsz + ss01), Plus Jakarta Sans (body), Geist Mono (code). All OFL-1.1, self-hosted variable woff2. Tight negative letterspacing on headings.
- **Borders:** 1px hairlines, 4px radius. No thick borders, no decorative shadows.
- **Motion:** fast (140–220ms), crisp, out-quart default. No bouncy nav, no stagger-for-the-sake-of-it.
- **Icons:** Lucide, 1.5px stroke, `currentColor`. Icon + label always unless unambiguous.
- **Imagery:** avoided in-product. No stock photos, no illustrations, no generative art.
