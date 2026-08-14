# Maintaining ParaCharts Documentation

ParaCharts documentation combines authored Markdown with generated API and configuration references. Generated Markdown is not committed; CI and deployment recreate it from source.

## Quick Start

```sh
npm run docs:dev
```

This generates the documentation once and starts VitePress. Restart it after changing configuration metadata, TSDoc comments, templates, or generator scripts.

Use `npm run docs:build` for the production build and `npm run docs:preview` to serve an existing production build.

## How Generation Works

Documentation has three source paths:

1. `lib/config/**/*.json` supplies configuration defaults and metadata. `lib/config/build_settings.py` generates the tracked defaults, metadata, and public TypeScript interfaces; the docs generator uses the same data for configuration reference pages.
2. Exported TypeScript declarations and TSDoc are processed by API Extractor. Its tracked compatibility report is `etc/paracharts.api.md`; API Documenter uses the resulting model to create the ignored API reference pages.
3. Data-derived pages use Mustache templates in `docs/templates/` with context modules in `docs/scripts/`.

VitePress builds these generated pages together with authored Markdown.

## Commands

| Command | Purpose |
|---|---|
| `npm run docs:dev` | Generate docs and start the VitePress development server |
| `npm run docs:build` | Generate docs and build `docs/.vitepress/dist` |
| `npm run docs:preview` | Serve an existing production build |
| `npm run docs:generate` | Run all documentation generators without building VitePress |
| `npm run docs:check` | After generation, check whether tracked generated artifacts changed |

## File Ownership

- Edit authored guides under `docs/`, site configuration and assets, templates and generator scripts, and config metadata in `lib/config/**/*.json`.
- Do not hand-edit the tracked generated files `lib/config/config_defaults.ts`, `lib/config/config_metadata.ts`, `lib/config/config_types.ts`, or `etc/paracharts.api.md`. Regenerate and review them.
- Generated Markdown, including `docs/api/`, `docs/config/`, `docs/config.md`, `docs/manifest.md`, `docs/paraapi.md`, and `docs/shortcutsAndCommands.md`, is ignored and remains untracked. CI and deployment recreate it.

The generator rejects duplicate output paths and refuses to overwrite authored Markdown outside generator-owned directories.

## Add an Authored Guide

Use Markdown for prose that does not depend on source data.

1. Add `docs/my-guide.md`.
2. Add its link to `docs/.vitepress/config.ts` if it should appear in navigation.
3. Put static assets in `public/`; VitePress is configured to use that directory.
4. Run `npm run docs:build` and follow links in the built site.

Do not add a Mustache template for a static page. Templates are reserved for generated content.

## Document a Public Module

The API reference is generated from the package's exported TypeScript declarations.

1. Export the public symbol through `lib/index.ts` or a file re-exported by `lib/common_exports.ts`.
2. Add useful TSDoc to the exported declaration, including an appropriate release tag such as `@public`.
3. Run `npm run docs:generate`.
4. Review `etc/paracharts.api.md` as an API compatibility change.
5. Add an authored guide only when users need workflows or examples beyond the generated reference. Link it in VitePress navigation.

`docs:generate` stages `temp/paracharts.api.json` in `docs/.api-model/`. API Documenter consumes only that directory, so unrelated or stale API models in `temp/` are not included.

## Add Configuration Documentation

Configuration documentation is generated from `lib/config/**/*.json`; there is no separate prose inventory to update.

An `index.json` describes its containing group, while a named JSON file creates a child group. For example, `lib/config/axis/index.json` describes `axis`, and `lib/config/type/bubble.json` describes `type.bubble`.

Each visible setting requires at least `description`, `type`, and `default`; add control metadata when the setting appears in the control panel. Give a group a concise `description` unless an inherited description already describes it accurately.

The non-obvious group fields are:

- `ref`: inherit settings and metadata from another group, such as a chart type inheriting from `type.plane`.
- `abstract`: define a reusable base group that is not exposed as a concrete configuration group.
- `family`: associate a concrete chart-type group with its runtime chart family.

Follow a nearby config file with the same inheritance or control pattern rather than introducing a second descriptor shape.

After changing config JSON:

```sh
npm run config:generate
npm run docs:build
```

Commit updates to `config_defaults.ts`, `config_metadata.ts`, and `config_types.ts`. Missing visible-setting descriptions fail generation. Chart-type default overrides are maintained separately in `lib/state/settings_defaults.ts` and appear in the generated chart-type defaults page.

## Add a Generated Page

A template and context module share a basename:

```text
docs/templates/example.tpl
docs/scripts/example.ts
```

For one page, export default context. Without a `pages` export, `example.tpl` writes `docs/example.md`.

```ts
export default {
  title: 'Example',
  rows: [
    { name: 'First row', value: 1 },
    { name: 'Second row', value: 2 },
  ],
};
```

For a family of pages, export explicit output paths and contexts:

```ts
const records = [
  { slug: 'first', title: 'First page' },
  { slug: 'second', title: 'Second page' },
];

export const pages = records.map(record => ({
  outputPath: `example/${record.slug}.md`,
  context: record,
}));

export const cleanOutputDirectories = ['example'];
```

Declare `cleanOutputDirectories` only when the generator owns the entire directory: it is replaced on each run. Add generated outputs to `.gitignore`. `buildDocs.ts` validates paths, rejects overlapping clean directories and duplicate outputs, writes generated headers, and records outputs for safe stale-page removal.

## Navigation and Generated Pages

VitePress navigation is configured in `docs/.vitepress/config.ts`. Configuration categories and chart types are derived from `defaultConfig`; authored guides and other generated pages require explicit navigation entries.

If a generated page is renamed or removed, update its template or `pages` output and any VitePress links. Run `npm run docs:generate`; the generated-page manifest removes stale generated files without deleting authored Markdown.

## CI and Deployment

The Build and Test workflow builds the library, runs unit tests, builds docs, and runs `docs:check`. Generated Markdown remains ignored because the production build proves it can be recreated.

GitHub Pages deployment runs only after Build and Test succeeds on `main`. Deploy Docs also supports manual dispatch. Deployment rebuilds the site rather than relying on local or committed generated Markdown.

## Troubleshooting

- Private package installation requires npm authentication for `https://npm.fizz.studio`.
- Treat an API report diff as intentional only when the exported public surface changed.
- If a page is missing, run `npm run docs:generate` and fix the first generator failure; do not edit generated Markdown.
- If navigation is broken, verify both the generated or authored path and its entry in `docs/.vitepress/config.ts`.
- If a generator refuses to overwrite a page, determine whether the page should be authored or generated instead of bypassing the ownership check.
- Normal generation replaces API and configuration directories atomically. Delete ignored output manually only when investigating stale local state.
