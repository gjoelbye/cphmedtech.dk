# Copenhagen MedTech Website

The official website for Copenhagen MedTech — a student organisation connecting students and stakeholders in the MedTech industry through summits and events.

**Live:** [cphmedtech.dk](https://cphmedtech.dk)

## Stack

- [Astro](https://astro.build) v6 — static site generator
- SCSS with BEM naming conventions
- MDX for rich content
- Cloudflare Pages for hosting

## Getting Started

```bash
npm install
npm run dev       # Start dev server at localhost:4321
npm run build     # Production build → dist/
npm run preview   # Preview built site locally
```

## Project Structure

```
src/
├── pages/          # Route-based pages (index, 2025, past-events, partners, contact, 404)
├── layouts/        # BaseLayout (all pages), PageLayout (contained pages)
├── components/     # Organized by feature (home, events, cmis2025, partners, contact, shared, layout)
├── styles/         # SCSS partials (tokens, reset, typography, animations, mixins, components)
├── content/        # YAML content collections (events, partners, speakers)
├── assets/         # Images and logos (processed by Astro's image pipeline)
└── scripts/        # Client-side scripts (mobile menu, timeline observer)
```

## Adding Content

Content is managed through YAML files in `src/content/`. Schemas are validated by Zod at build time.

1. **Add an event:** Create a YAML file in `src/content/events/` following the existing format
2. **Add a partner:** Create a YAML file in `src/content/partners/` and add the logo to `src/assets/logos/`
3. **Add a speaker:** Create a YAML file in `src/content/speakers/`

Open a pull request — CI will validate the schema during build.

## Quality Checks

```bash
npm run check       # TypeScript type checking
npx stylelint "src/**/*.scss"  # SCSS linting
npm run build       # Full build (validates all content schemas)
```
