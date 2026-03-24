import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const events = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    sortDate: z.coerce.date(),
    year: z.number(),
    description: z.string(),
    type: z.enum(['summit', 'hackathon', 'lecture', 'case-event', 'workshop', 'other']),
    location: z.string().optional(),
    isFeatured: z.boolean().default(false),
    externalUrl: z.string().url().optional(),
    image: z.string().optional(),
  }),
});

const partners = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/partners' }),
  schema: z.object({
    name: z.string(),
    category: z.enum(['strategic', 'industry', 'foundation']),
    logo: z.string(),
    website: z.string().url().optional(),
    sortOrder: z.number().default(0),
  }),
});

const speakers = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/speakers' }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    organization: z.string(),
    event: z.string(),
    photo: z.string().optional(),
    bio: z.string().optional(),
    sortOrder: z.number().default(0),
  }),
});

export const collections = { events, partners, speakers };
