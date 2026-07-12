## Adding content (career entries / projects)

Career and project entries are content-collection files — add a new entry by copying an existing `.md` file, not by editing any template/page code:

- Career/education entries: `src/content/career/*.md`
- Projects: `src/content/projects/*.md`

Required frontmatter fields are defined in `src/content.config.ts`. Copy `georgia-tech-ms.md` or `sample-project.md` as a starting point, fill in the frontmatter, and write the body in Markdown. The Career and Projects pages automatically pick up every file in these folders — no other files need to change. Set `pdf` to a path under `public/` (e.g. `/docs/my-file.pdf`) to get a click-to-preview modal on that entry; leave it blank to omit.

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
