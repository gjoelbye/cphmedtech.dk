# CPH MedTech Website

## Stack
- Astro v6 (static output)
- SCSS with BEM naming
- MDX for content
- Cloudflare Pages for hosting

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build (validates all content)
- `npx astro check` — TypeScript checking
- `npx stylelint "src/**/*.scss"` — SCSS linting

## Architecture
- Pages in `src/pages/`
- Layouts in `src/layouts/` (BaseLayout wraps all pages, PageLayout adds container)
- Components in `src/components/` organized by page/feature
- Styles in `src/styles/` with SCSS partials (tokens, reset, typography, animations, mixins, components)
- Content collections in `src/content/` (events, partners, speakers) with Zod schemas in `src/content.config.ts`
- Images in `src/assets/` (processed by Astro's image pipeline)
- Static files in `public/` (fonts, favicons, robots.txt)

## Content Model
- Events: `src/content/events/*.yaml` — one file per event
- Partners: `src/content/partners/*.yaml` — one file per partner
- Speakers: `src/content/speakers/*.yaml` — one file per speaker
- Schemas validated by Zod at build time

## Adding Content
1. Create a YAML file in the appropriate `src/content/` subdirectory
2. Follow the schema (copy an existing file as template)
3. Open a PR — CI will validate the schema during build
4. Images referenced in content must exist in `src/assets/`

## Conventions
- SCSS uses BEM naming (`.block__element--modifier`)
- Design tokens in `_tokens.scss` — never use raw color values
- Components are `.astro` files (no React/Vue)
- Minimal client JS — only `timeline-observer.ts` and `mobile-menu.ts`
- All external links: `target="_blank" rel="noopener noreferrer"`
- Images use Astro's `<Image>` component for optimization
