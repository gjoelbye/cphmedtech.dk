# Copenhagen MedTech Website

The official website for Copenhagen MedTech — a student organisation connecting students and stakeholders in the MedTech industry through summits and events.

**Live:** [cphmedtech.dk](https://cphmedtech.dk)

## Stack

- [Astro](https://astro.build) v6 — static site generator
- SCSS with BEM naming conventions
- MDX for blog content
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
├── pages/          # 13 route-based pages
├── layouts/        # BaseLayout, PageLayout
├── components/     # Organized by feature
├── styles/         # SCSS partials (tokens, reset, typography, animations, mixins, components)
├── content/        # YAML/MDX content collections
├── assets/         # Images and logos (Astro image pipeline)
└── scripts/        # Client-side JS (mobile menu, stat counter, timeline, network banner)
```

## Adding Content

Content is managed through YAML and MDX files. Schemas are validated by Zod at build time.

### Add an event
Create a YAML file in `src/content/events/`:
```yaml
title: "Event Name"
date: "Month Day, Year"
sortDate: YYYY-MM-DD
year: 2025
description: "Description of the event."
type: summit  # summit | hackathon | lecture | case-event | workshop | other
location: "Venue Name"
isUpcoming: true  # shows on /events/ page
registrationUrl: "https://..."
time: "15:00 – 21:00"
price: "Free"
```

### Add a team member
Create a YAML file in `src/content/team/`:
```yaml
name: "Full Name"
role: "Role Title"
department: "Board"  # Board | Events | Marketing | Partnerships | Operations
bio: "Short bio..."
linkedin: "https://linkedin.com/in/..."
sortOrder: 1
active: true
```

### Add a blog post
Create an MDX file in `src/content/blog/`:
```mdx
---
title: "Post Title"
slug: "post-slug"
publishDate: 2025-01-15
description: "Short description for cards and SEO."
tags: ["tag1", "tag2"]
---

Write your content here using Markdown.
```

### Add a partner
Create a YAML file in `src/content/partners/` and add the logo to `src/assets/logos/`.

Open a pull request — CI validates schemas during build.

## Quality Checks

```bash
npm run check                      # TypeScript type checking
npx stylelint "src/**/*.scss"      # SCSS linting
npm run build                      # Full build (validates all content)
```
