## Adding content (career entries / projects / news)

Career, project, and news entries are content-collection files — add a new entry by copying an existing `.md` file, not by editing any template/page code:

- Career/education entries: `src/content/career/*.md`
- Projects: `src/content/projects/*.md`
- News: `src/content/news/*.md`

Required frontmatter fields are defined in `src/content.config.ts`. Copy any existing file as a starting point (e.g. `georgia-tech-ms.md` for education, `mercedes-benz.md` for employment, `asm-design-competition.md` for an award, `sample-project.md` for a project, `spacecom-2024-orlando.md` for a news entry), fill in the frontmatter, and write the body in Markdown. The Career, Projects, and News pages automatically pick up every file in these folders — no other files need to change. Career entries can set `pdf` to a path under `public/` (e.g. `/docs/my-file.pdf`) to get a click-to-preview modal on that entry; leave it blank to omit. Projects and News use `gallery` instead (see below).

### Resume

The "Resume" nav button (`src/components/Nav.astro`) isn't a content-collection entry — it's a fixed, site-wide fullscreen PDF viewer, since there's only ever one resume. To update it, just replace `public/docs/nathan-obrien-resume.pdf` with the new file (same filename); no code changes needed unless the filename changes too.

### Career page timeline fields

The Career page renders entries as a vertical timeline (`src/pages/career/index.astro`), so `career/*.md` entries have two fields beyond the shared ones above:

- `category` (required): one of `"education"`, `"employment"`, `"award"`, `"research"`, `"leadership"`, `"publications"`. Drives the timeline bubble's color (see the `--color-timeline-*` tokens in `src/styles/tokens.css`) and the label shown on the card — no other file needs to change to add a new category's worth of entries, just reuse one of these values. `"leadership"` (white bubble) is for extracurriculars, affiliations, and volunteering, and otherwise behaves like `"employment"` (same fields, Details section shown). `"publications"` (purple bubble) is for papers/articles — use `journal` and `doi` instead of `organization`/`location`; see below.
- `organization` (required for every category except `"publications"`, which uses `journal` instead): the org/school/award-body name, paired with `location` in the card's subtitle line.
- `gallery` (optional): a list of image paths under `public/` (e.g. `["/images/my-photo.jpg"]`). Renders as a photo gallery in the timeline's right-hand column, paired with that entry's row. Leave it as `[]` (or omit) to show nothing there.
- `logo` (optional): a path under `public/` to a logo image, shown in the tile's corner frame. Leave it unset to show an empty placeholder frame reserving that spot. Logo images always get a solid white outline; the empty placeholder stays a dashed neutral outline.
- `logoShape` (optional, default `"circle"`): `"circle"`, `"rectangle"`, or `"square"`. Use `"rectangle"` for wide wordmarks that look bad cropped to a circle (same height, wider). Use `"square"` for icon-style logos that lose corner detail cropped to a circle but don't need extra width. Only one shape ever renders; they share the same top-right slot.
- `highlights` (optional): a list of short bullet strings — aim for 3-5 — describing what you actually did. Shown as a "Details" section in the tile's expanded view (click any tile to open it), for any category including `"award"`. Leave it as `[]` (or omit) to skip the section.
- `organizationUrl` (optional): a link to the organization/school/award-body's website. Shown in a dedicated "Organization" section of the expanded view, labeled with the entry's `organization` value. Leave it unset to skip the section.
- `gpa` (optional): a string like `"3.85 / 4.00"`. Shown in a dedicated "GPA" section of the expanded view. Intended for `category: "education"` entries, but not hard-enforced — just don't set it on entries where it doesn't make sense.
- `hours` (optional): `"full-time"` or `"part-time"`. Rendered right after `location` as "Full-time"/"Part-time" (the word "hours" itself is never shown) — same dot-separator/one-line-if-it-fits-else-wrap convention as organization/location. Only shows if `location` is also set. Intended for `category: "employment"` entries, but not hard-enforced.
- `journal` (optional): the journal/publication name, shown as a plain subtitle line in place of the organization/location pairing. Intended for `category: "publications"` entries, which have no `location`.
- `doi` (optional): a full DOI URL (e.g. `https://doi.org/10.xxxx/...`). Shown as a "View Publication" link in a dedicated section of the expanded view. Intended for `category: "publications"` entries.

Every tile on the Career page is clickable — clicking anywhere on a tile (that isn't a nested link) opens an expanded view with all of that entry's info. This is automatic for every entry; there's no per-entry field to opt in or out of it.

An entry can have `pdf`, `gallery`, both, or neither — whatever fits. Entries sort most-recent/ongoing-first automatically (by `endDate`, with entries missing `endDate` treated as "present"); there's nothing to update manually when adding a new entry to keep the ordering correct.

### Projects page fields

The Projects page (`src/pages/projects/index.astro`) renders one hand-picked entry as a full-width featured section up top, then everything else as a standardized card grid ("Past projects") below. Every `projects/*.md` entry also gets its own standalone detail page automatically at `/projects/<filename-without-extension>/` (via `src/pages/projects/[id].astro`) — not linked from the nav, only reachable via a project's own "Full project details" link.

- `gallery` (optional): a list of `{ type: "image" | "pdf", src, alt? }` objects, `src` a path under `public/`. Renders as an autorotating, clickthrough carousel (arrows, dot nav, click any slide to open it full-size with its own prev/next, pauses on hover/focus, respects reduced-motion) on the standardized card only — the detail page does not repeat it. Mix image and pdf items freely in one list — pdf slides show as a labeled document tile and open the PDF in a modal. Keep this list small and curated (4-6 images); it's a teaser for the card, not the place to dump every plot.
- `featured` (optional, default `false`): set on exactly one entry to render it via the full-width featured section (embedded tool + summary + instructions) instead of in the grid. Requires `embedUrl`.
- `embedUrl` (optional): external URL iframed full-width in the featured section and again on that entry's detail page. Only meaningful when `featured: true`.
- `instructions` (optional): a list of short ordered strings, shown as a numbered "How to use it" list under the featured embed and on the detail page.
- `reportPdf` (optional): a path under `public/` to the project's single primary document (e.g. a final report). Shown as its own preview-modal trigger near the top of the detail page — distinct from `gallery`'s pdf slides, which are for supplementary documents mixed into the photo carousel. Use this when there's genuinely one headline document.
- `documents` (optional): a list of `{ label, href }` objects, `href` a path under `public/`. Renders as a row of labeled preview-modal buttons under a "Documents" section. Use this instead of `reportPdf` when a project has multiple source documents (a proposal, a deck, etc.) with no single one that's the "report" — e.g. the SBI project's grant proposal + pitch deck.
- `documentsFirst` (optional, default `false`): when `true`, renders the `documents` buttons right after the header, in the same spot `reportPdf` occupies, instead of their normal position after Details. Leave unset for the standard placement (e.g. the SBI project) — only set this when the documents themselves are the headline thing a visitor should see first.
- `summary` (required): a short, resume-style overview — one or two sentences, written objectively (what you did, what you found), no need for "I". Shown on the card's blurb AND as the detail page's "Project overview" section. Keep this genuinely short; it reads badly on the card if it runs long.
- `details` (optional): a longer paragraph that flows from `summary` with the real context a resume line can't fit — motivation, background, how it connects to other coursework/work. First person is fine here. Shown on the detail page, as its own "Details" section.

Detail-page block order is: Final report (if `reportPdf`) → Project overview (`summary`) → How to use it (if `instructions`) → Details (if `details`) → Documents (if `documents`) → the rendered body → Links. Fields you don't set just don't render — a solo project with no `instructions`/`documents` (like the Kalman Filtering write-up) and a multi-person project with both (like the SBI tool) share the exact same template.

The Markdown **body** of a `projects/*.md` file is rendered on that entry's detail page — this is where the real long-form writing belongs: how it works, why you made the decisions you did, what the data showed. Frontmatter stays for short/structured/repeatable fields (`gallery`, `tags`, `links`, `documents`, etc.); anything long-form goes in the body instead of inventing a new frontmatter field for it. There's no separate "Collaboration"/"Timeline"/"Contributions" section on the detail page — that kind of context reads better folded into `details` and the body's own prose than broken out into boilerplate sections.

Every section header on the detail page — "Final report", "Project overview", "Details", "Documents", and every `##` heading inside the rendered body — shares one visual style (small mono label), so the page reads as one consistent document rather than a patchwork of typographic styles. Don't introduce a differently-styled heading level; if a body needs a heading it should look like the others.

### Adding plots/photos inline in a project write-up

The detail page's body supports plain HTML `<figure>` blocks directly in the Markdown (Astro passes raw HTML through) — this is how to drop an image between paragraphs, styled consistently with the rest of the write-up (bordered panel, muted mono caption):

```html
<figure>
<img src="/images/my-project/some-plot.png" alt="Describe what the plot shows" />
<figcaption>A short caption explaining what to look for.</figcaption>
</figure>
```

A `<video>` works the same way, styled identically (bordered panel, same treatment as `img`) — use `controls preload="metadata"` and a `poster` image so it doesn't eagerly download on page load, only once someone actually presses play:

```html
<figure>
<video controls preload="metadata" poster="/images/my-project/some-poster.png">
<source src="/videos/my-project/some-clip.mp4" type="video/mp4" />
Your browser does not support the video tag.
</video>
<figcaption>A short caption explaining what's happening in the clip.</figcaption>
</figure>
```

Video files go under `public/videos/<project-slug>/`. Keep it to one or two clips per write-up, not a dump of every raw recording — the same curation principle as `gallery`.

Leave a blank line before and after the block (required for Markdown to parse raw HTML correctly). Keep the write-up a single continuous column — every figure renders full-width, in flow with the surrounding text. There's no float/side-by-side layout for images; a plot squeezed into a narrow side column just becomes unreadable, especially for the dense multi-axis MATLAB-style figures this site tends to use. Reference as many images as the write-up genuinely needs to make its point; this is a different job from `gallery` above, which stays small and curated.

### News page fields

The News page (`src/pages/news/index.astro`) renders a recent-first list on the left (title, date, location, a 1-2 sentence `description`) and a photo gallery on the right that shows whichever entry's `gallery` was last clicked, defaulting to the most recent entry. No detail page — everything for a news entry lives in the list + gallery on this one page.

- `date` (required): `"YYYY-MM-DD"`. Drives sort order (most recent first); `order` breaks ties (e.g. entries sharing a placeholder date). If you don't know the exact day, using the 1st of the month is fine as a placeholder — just fix it later, since it only affects sort order relative to other entries from the same month.
- `location` (required): shown next to the date in the list.
- `description` (required): 1-2 sentences. This is the only body text — News entries don't get a Markdown body or detail page like Projects do.
- `gallery` (optional): same `{ type: "image" | "pdf", src, alt? }` shape as Projects, rendered through the same `ProjectGallery` component — autorotating carousel, click-to-enlarge lightbox, everything. Unlike Projects' gallery (a small curated teaser), a News entry's gallery can hold everything you want to show from that event.

Adding a new entry is the same as everywhere else: copy an existing `news/*.md` file, fill in the frontmatter, add its photos under `public/images/news/`. It automatically appears in the list in the right sorted position — no page code changes, and nothing about the layout needs a fixed height or scroll container to keep working as the list grows, since the gallery panel is sticky (stays in view next to the list) rather than sized to match it.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
