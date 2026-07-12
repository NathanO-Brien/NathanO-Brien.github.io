import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const linkSchema = z.object({
	label: z.string(),
	url: z.string(),
});

const career = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/career" }),
	schema: z.object({
		title: z.string(),
		organization: z.string(),
		location: z.string().optional(),
		startDate: z.string(),
		endDate: z.string().optional(), // omit for "present"
		summary: z.string(),
		category: z.enum(["education", "employment", "award"]), // drives the timeline bubble color + card label
		tags: z.array(z.string()).default([]),
		links: z.array(linkSchema).default([]),
		pdf: z.string().optional(), // path under /public to a doc, e.g. /docs/offer-letter.pdf -- rendered in the timeline's right-hand media column
		gallery: z.array(z.string()).default([]), // paths under /public to images -- rendered as a photo gallery in the timeline's right-hand media column
		order: z.number().default(0), // lower sorts first within a tie; entries are primarily sorted by date
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		role: z.string().optional(),
		date: z.string(),
		status: z.enum(["ongoing", "complete"]).default("complete"),
		tags: z.array(z.string()).default([]),
		links: z.array(linkSchema).default([]),
		pdf: z.string().optional(),
		image: z.string().optional(),
		order: z.number().default(0),
	}),
});

export const collections = { career, projects };
