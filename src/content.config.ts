import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

function safeGlob(options: Parameters<typeof glob>[0]) {
  const inner = glob(options);
  return {
    ...inner,
    async load(context: Parameters<typeof inner.load>[0]) {
      const baseDir = new URL((options.base ?? '.').toString().replace(/\/?$/, '/'), context.config.root);
      const entries = await readdir(fileURLToPath(baseDir), { recursive: true }).catch(() => [] as string[]);
      const hasMarkdown = entries.some((entry) => /\.(md|mdx)$/i.test(String(entry)));
      if (!hasMarkdown) {
        context.store.clear();
        return;
      }
      await inner.load(context);
    },
  };
}

const journal = defineCollection({
  loader: safeGlob({ pattern: '**/*.{md,mdx}', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    summary: z.string().max(220),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    lang: z.enum(['en', 'zh-CN']).default('en'),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: safeGlob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    summary: z.string(),
    client: z.string(),
    work: z.string(),
    role: z.string(),
    thumbnail: z.string(),
    thumbnailAlt: z.string(),
    featuredOrder: z.number().default(99),
    liveUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    gallery: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
    })).default([]),
  }),
});

export const collections = { journal, projects };
