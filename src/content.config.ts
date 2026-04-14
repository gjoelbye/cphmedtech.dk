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
    isUpcoming: z.boolean().default(false),
    externalUrl: z.string().url().optional(),
    registrationUrl: z.string().url().optional(),
    image: z.string().optional(),
    coverImage: z.string().optional(),
    time: z.string().optional(),
    capacity: z.number().optional(),
    price: z.string().optional(),
    pageUrl: z.string().optional(),
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
    logoScale: z.number().default(1),
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

const team = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    department: z.enum(['Board', 'Events', 'Marketing', 'Partnerships', 'Operations']),
    photo: z.string().optional(),
    bio: z.string().optional(),
    linkedin: z.string().url().optional(),
    sortOrder: z.number().default(0),
    active: z.boolean().default(true),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    publishDate: z.coerce.date(),
    description: z.string(),
    coverImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { events, partners, speakers, team, blog };
