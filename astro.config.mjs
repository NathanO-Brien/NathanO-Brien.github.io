// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://nathano-brien.github.io',
	integrations: [
		sitemap({
			// sample-project is a hidden template entry (see content.config.ts's
			// `hidden` field) -- it's deliberately unlinked from the site's own
			// nav/grid, so it shouldn't show up as a real page in search results
			// either, even though its route still exists for direct access.
			filter: (page) => !page.includes('/projects/sample-project/'),
		}),
	],
});
