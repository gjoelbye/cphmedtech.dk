# Working on the Copenhagen MedTech website

This is the website for Copenhagen MedTech, a student organisation that connects students with the MedTech industry through its annual Innovation Summit (CMIS) and other events. It lives at [cphmedtech.dk](https://cphmedtech.dk).

The site is built with Astro 6 as a fully static site, styled with SCSS, and hosted on Cloudflare: Workers Builds builds the repo and `wrangler.jsonc` serves the `dist/` folder. Most updates are content changes (a new event, a new partner, a blog post), and those should rarely need code.

These notes are for anyone changing the site, human or AI. Read them before your first change.

## Commands

```bash
npm install
npm run dev                       # http://localhost:4321
npm run build                     # must pass; it also validates all content
npx stylelint "src/**/*.scss"     # must pass
npx astro check                   # type check, see below
```

`astro check` needs `@astrojs/check` and `typescript`, which aren't project dependencies yet. Install them without touching `package.json` using `npm install --no-save @astrojs/check typescript`. There are 258 known errors, all in `src/scripts/network-banner.ts`. Don't add new ones anywhere else.

A change is done when the build and stylelint pass and you have looked at the pages you touched in a browser, at desktop width and at phone width (about 375px).

## How the site fits together

- `src/pages/` has one file per route. Event pages live in `src/pages/events/`.
- `src/layouts/`: `BaseLayout` wraps every page, and `PageLayout` adds a standard container.
- `src/components/` is grouped by feature:
  - `shared/` holds the reusable pieces (Button, Icon, EventCard, EventPhase, ContentSection).
  - `summit/` holds the CMIS page sections.
  - `home/`, `events/`, `partners/` and `layout/` are what they sound like.
  - `cmis2025/` only holds the 2025 speakers section.
- `src/content/` holds the content as YAML and MDX. The schemas are in `src/content.config.ts`.
- `src/utils/` has small helpers: `event-dates.ts` decides whether an event is upcoming, and `logos.ts` looks up logo files.
- `src/scripts/` has the client-side scripts. `src/styles/` has the global SCSS partials and design tokens.
- `src/assets/` holds images that go through Astro's image pipeline. `public/` holds files served as-is (fonts, favicons, the header logo SVG).

## Content

Everything editable lives in `src/content/`, one file per item. Copy an existing file as a template. The build fails if a file doesn't match its schema, which is a feature.

**Events** (`src/content/events/*.yaml`):
- `sortDate` decides everything time-related. An event shows under Upcoming Events on the home page and /events/ until the end of its day (Copenhagen time), then drops off by itself. There is no "upcoming" flag to maintain.
- `pageUrl` links the event's own page from its event card and from the timeline.
- `isFeatured: true` on an upcoming event with a `pageUrl` puts a "Next event" box in the home page hero. Only feature one event at a time.
- `companies` and `collaborator` list partner IDs (partner file names without `.yaml`). The CMIS pages use them to show the companies. Nothing checks that an ID exists until a page reads it, so build and look at the page after changing them.

**Partners** (`src/content/partners/*.yaml`):
- Each partner needs a logo in `src/assets/logos/`: WebP, at most 400px wide, trimmed so there's no empty border around it.
- Use `logoScale` only if a logo looks too small next to the others.
- Every partner should have a `website`.

**Other collections:** speakers (used by the 2025 summit page), team (the page exists but is hidden from the navigation), and blog posts as MDX.

## Event pages

Each big event gets a page in `src/pages/events/`. To make one for a new summit, copy `cmis-2026.astro` and change the data:

- Read the event with `getEntry('events', '<file name>')` and take the date, time, price, ticket URL and companies from it. Don't type them into the page again.
- Use the shared `summit/` components and pass them the content as props. Don't copy components into a new per-year folder.
- Wrap anything that only makes sense before the event (sign-up buttons, ticket links, deadlines) in `<EventPhase date={event.data.sortDate} show="upcoming">`. Give it a `show="past"` counterpart with a short "took place" note. Pages switch over by themselves on the day after the event, even without a redeploy, because `src/scripts/event-status.ts` re-checks the date in the browser.
- Keep old event pages. They stay linked from the timeline.
- The navigation is defined twice: `src/components/layout/Header.astro` and `src/components/layout/MobileMenu.astro`. Update both.

## Styling

- Use SCSS with BEM class names (`.block__element--modifier`) and component-scoped `<style lang="scss">` blocks.
- Colours, shadows, radii and breakpoints come from `src/styles/_tokens.scss`. Don't write raw colour values. A few older spots still have them, so don't copy those.
- Reuse what's there:
  - `.card` for cards (it gives the hover lift and shadow)
  - `section--surface` (light blue) or `section--dark` (brand gradient) for full-width sections
  - `Button` with the `primary`, `outline` or `outline-light` variant (use `outline-light` on dark backgrounds)
  - `.link-arrow` for "more" links
- Astro scopes styles per component, and the scope does not reach into child components. A class you pass to `<Icon class="...">` won't pick up your component's styles. Wrap the child in an element you own and style that. Astro's `<Image>` is the exception: it does forward the scope.
- The `hidden` attribute always hides an element. A global `[hidden] { display: none !important; }` makes sure of that.

## Images

- Use `<Image>` from `astro:assets` for anything in `src/assets/`, so it gets resized and converted.
- Logos are WebP. Look them up with `getLogoSrc()` from `src/utils/logos.ts` instead of importing logo files by hand.
- Give decorative images and logos that sit next to their name `alt=""`. Otherwise describe the image.

## Writing for the site

- Write plainly and specifically: what happens, when, where, and who it's for.
- Don't use em dashes. En dashes in time ranges like "15:15 – 20:45" are fine.
- Avoid phrases that sound machine-written or like marketing filler: "bridging the gap", "next generation", "groundbreaking", "elevate", "step into the future", "unlock" and similar.
- Contact details:
  - Email: hello@cphmedtech.dk (never an @copenhagenmedtech.org address; CI checks for it)
  - LinkedIn: https://www.linkedin.com/company/cph-medtech/
  - Instagram: https://www.instagram.com/cph_medtech/
- Links to other sites open in a new tab with `target="_blank" rel="noopener noreferrer"`. `Button` does this when you pass `external`.

## Client-side scripts

- Every page is a full page load. View Transitions (`<ClientRouter />`) are deliberately not used, because they broke scoped styles and scripts. So scripts can query the DOM at the top level.
- `network-banner.ts` draws the animated logo network in the home page hero. It is large and fragile, so change it with care and check the hero afterwards.
- The "Next event" box in the hero floats beside the logo only on screens where it can't cover the logo; that rule is a media query in `HeroBanner.astro`. If you change the logo's size or position, check the hero at a few sizes again, for example 1280×800, 1440×900, 1920×1080 and 2560×1440.

## Pull requests

- Work on a branch and open a pull request against `main`.
- CI runs stylelint, a check for the wrong email domain, `astro check` and the build.
- Pull requests from forks wait for a maintainer to approve the workflow run before any checks appear.
- In the description, say what you changed and how you checked it.
