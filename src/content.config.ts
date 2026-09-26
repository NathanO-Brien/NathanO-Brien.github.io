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
		organization: z.string().optional(), // omit for category "publications" -- use `journal` instead
		location: z.string().optional(),
		lat: z.number().optional(), // decimal degrees, e.g. 29.6516 -- with `lon`, places a marker on the career page's location map (preview-b) at this entry's real position, instead of a rough per-state guess
		lon: z.number().optional(), // decimal degrees, e.g. -82.3248 (negative = west) -- must be set together with `lat`; entries missing either just don't get a marker
		startDate: z.string(),
		endDate: z.string().optional(), // omit for "present"
		summary: z.string(),
		category: z.enum(["education", "employment", "award", "research", "leadership", "publications"]), // drives the timeline bubble color + card label
		tags: z.array(z.string()).default([]),
		links: z.array(linkSchema).default([]),
		pdf: z.string().optional(), // path under /public to a doc, e.g. /docs/offer-letter.pdf -- rendered in the timeline's right-hand media column
		gallery: z.array(z.string()).default([]), // paths under /public to images -- rendered as a photo gallery in the timeline's right-hand media column
		logo: z.string().optional(), // path under /public to a logo image, shown in the card's corner frame; omit to show an empty placeholder frame
		logoShape: z.enum(["circle", "rectangle", "square"]).default("circle"), // "rectangle" for wide wordmarks, "square" for icons that look bad cropped to a circle
		highlights: z.array(z.string()).default([]), // 3-5 short bullets describing what you did, shown in the tile's expanded (click-to-open) view; omit (or []) to skip the section
		organizationUrl: z.string().optional(), // link to the organization/school/award-body's website, shown in a dedicated section of the expanded view
		gpa: z.string().optional(), // e.g. "3.85 / 4.00" -- shown in a dedicated section of the expanded view (intended for category "education" entries)
		hours: z.enum(["full-time", "part-time"]).optional(), // shown after location (same line if it fits, same dot/wrap convention as organization/location) as "Full-time"/"Part-time" -- intended for category "employment" entries
		journal: z.string().optional(), // journal name, shown in place of the organization/location line -- intended for category "publications" entries (which have no location)
		doi: z.string().optional(), // full DOI URL (e.g. https://doi.org/10.xxxx/...), shown as a "View Publication" link in the expanded view -- intended for category "publications" entries
		order: z.number().default(0), // lower sorts first within a tie; entries are primarily sorted by date
	}),
});

const galleryItemSchema = z.object({
	type: z.enum(["image", "pdf"]),
	src: z.string(), // path under /public
	alt: z.string().optional(), // alt text (images) or a short label (pdf slides); falls back to the project title
});

const projects = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
	schema: z.object({
		title: z.string(),
		summary: z.string(), // short, resume-style overview -- shown on the card AND as the detail page's "Project Overview" section
		details: z.string().optional(), // a longer paragraph that flows from `summary` with real context (motivation, background) -- shown only on the detail page, as its own "Details" section
		role: z.string().optional(),
		startDate: z.string(), // "YYYY-MM" -- drives sort order (most recent first) and the date range shown on the card/detail page
		endDate: z.string().optional(), // "YYYY-MM" -- omit for "Present" (an ongoing project); if equal to startDate, renders as a single month/year instead of a redundant range
		status: z.enum(["ongoing", "complete"]).default("complete"),
		tags: z.array(z.string()).default([]),
		links: z.array(linkSchema).default([]),
		gallery: z.array(galleryItemSchema).default([]), // mixed photos/PDFs -- rendered as an autorotating, clickthrough carousel on the standardized card; click any slide to open it full-size
		thumbnail: z.string().optional(), // path under /public to a small square image, shown next to this entry in the nav bar's Projects hover menu -- omit to fall back to the first image in `gallery`, or to a plain placeholder if that's empty/not an image
		hidden: z.boolean().default(false), // excludes this entry from the /projects/ grid and the nav dropdown while keeping its own detail page reachable -- for drafts/templates like sample-project that should stay in the repo for reference without being publicly linked
		reportPdf: z.string().optional(), // path under /public to the project's primary document (e.g. a final report) -- shown as its own preview trigger near the top of the detail page, distinct from gallery pdf slides
		documents: z
			.array(z.object({ label: z.string(), href: z.string() }))
			.default([]), // supplementary documents (proposals, decks) when there's no single "report" -- each renders as its own preview-modal button
		documentsFirst: z.boolean().default(false), // renders the `documents` buttons right after the header (same position as `reportPdf`) instead of their normal later spot after Details -- defaults to false so every existing entry is unaffected; set true only when a project's documents are the headline thing to lead with
		featured: z.boolean().default(false), // renders via <FeaturedProject> at the top of the page instead of in the grid -- exactly one entry should set this
		embedUrl: z.string().optional(), // external URL iframed full-width in the featured section; only meaningful when featured is true
		instructions: z.array(z.string()).default([]), // short ordered "how to use it" steps, rendered as a numbered list under the featured embed
		order: z.number().default(0),
	}),
});

const news = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
	schema: z.object({
		title: z.string(),
		date: z.string(), // "YYYY-MM-DD" -- entries sort most-recent-first by this field
		location: z.string(),
		description: z.string(), // 1-2 sentences, shown in the list next to date/location
		gallery: z.array(galleryItemSchema).default([]), // same shape as Projects' gallery -- rendered via the same ProjectGallery component
		url: z.string().optional(), // link to the event/article's own page -- when set, the entry's title/description text becomes a hyperlink to it (with a hover cue); the gallery is unaffected and stays reachable only via the thumbnail
		order: z.number().default(0), // lower sorts first within a tie (e.g. same placeholder date)
	}),
});

export const collections = { career, projects, news };
