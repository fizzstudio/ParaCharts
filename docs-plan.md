# Plan: Improve Docs Generation + Add Config System Docs

## Current state (verified on fresh `develop` clone)

**Docs pipeline** (`npm run docs:generate` = `tsc && api-extractor && tsx ./docs/scripts/buildDocs.ts`):
- `buildDocs.ts` is convention-based: each `docs/templates/<name>.tpl` is rendered with the
  default export of the same-named `docs/scripts/<name>.ts` (empty context if none) and
  written to `docs/<name>.md`. Sidebar is manual in `docs/.vitepress/config.ts`.
- Data-driven pages today: `manifest` (JSON schema), `paraapi` (API model),
  `shortcutsAndCommands` (action_map.json), `settingsObj` (API model + old settings files).

**Problems:**
1. `docs/scripts/settingsObj.ts` is **broken**: it imports `defaults` from
   `lib/state/settings_defaults.ts` (export removed in the config migration) and walks the
   `Settings` interface in the API model (interface deleted; `settings_types.ts` now only
   exports `FormatContext`/`FORMAT_CONTEXT_SETTINGS`). The checked-in `docs/settingsObj.md`
   is stale output from before the migration.
2. `buildDocs.ts` catches per-template errors and continues, so CI
   (`.github/workflows/deploy-docs.yml`, runs `docs:build` on `main`) **silently deploys
   broken/empty pages**.
3. Legacy `npm run doc` (api-documenter) writes API markdown into `docs/` — the VitePress
   source dir — but nothing links to it; it's clutter risk.
4. New config system (`lib/config/`) has no docs page. Its source of truth is
   `lib/config/**/*.json`; `build_settings.py` generates `config_types.ts` (doc comments
   copied from JSON `description`), `config_defaults.ts` (`defaultConfig`, refs already
   resolved), and `config_metadata.ts` (`configMetadata`, refs resolved via prototype
   chain at module load). `Config` is not exported from the entry point, so it is not in
   the API model.

## Decisions to confirm before starting

- **D1. Page name/URL:** replace `settingsObj.md` with a new `config.md` page (accurate,
  breaks old URL), or keep the `settingsObj` slug with new content? Recommendation:
  new `config` page, delete `settingsObj.*`.
- **D2. Include per-chart-type default overrides** (`chartTypeDefaults` in
  `lib/state/settings_defaults.ts`) as a secondary table? Recommendation: yes, small table.
- **D3. Export `Config` types from `lib/common_exports.ts` for API-reference docs?**
  Not needed for the VitePress page; skip unless API reference inclusion is wanted later.

## Phase 1 — Remove the broken page

- Delete `docs/scripts/settingsObj.ts`, `docs/templates/settingsObj.tpl`,
  `docs/settingsObj.md`, and `docs/scripts/rangeFormatter.ts` (only consumer was
  `settingsObj.ts`; new script gets ranges from `controlOptions`).
- Remove the `Settings Object` sidebar entry in `docs/.vitepress/config.ts`.

## Phase 2 — Add the config docs page

New `docs/scripts/config.ts`, modeled on the *shape* of the old script but sourcing all
data from the new config system (no API-model walk):

- Import `defaultConfig` from `../../lib/config/config_defaults.js` — the fully-flattened
  defaults tree; walk it to enumerate setting paths (this automatically resolves `ref`
  groups like `type.bar` → `type.plane`).
- Import `configMetadata` from `../../lib/config/config_metadata.js` for
  `description`, `type`, `label`, `advanced`, `hidden`, `controlOptions` per setting.
  **Caveat:** `ref` inheritance is resolved via prototype chaining, so use `for...in`
  (or an explicit prototype walk) rather than `Object.entries` to see inherited settings.
- Per setting, emit `{ path, description, defaultValue, validValues }`:
  - `validValues`: use the JSON `type` string; escape `|` for Markdown tables; keep the
    old glossary pattern (expand unions ≤3 inline, link longer ones to a per-category
    type glossary). Do **not** reuse the old hardcoded `TYPE_EXPANSIONS` map — the new
    `ChartType` union differs from the old one. Resolve named types (`CardinalDirection`,
    `BarDataLabelPosition`, …) against `config_types.ts` exports, or fall back to a small
    generated map.
  - Numeric ranges: from `controlOptions.min`/`max` when `control` is `slider`/number;
    skip otherwise.
  - Skip `hidden: true` settings; mark `advanced: true` settings (e.g. italic or a † note).
- Group by top-level path segment; carry over the `categoryDescriptions` map from the old
  script (drop categories that no longer exist: `statusBar`, `dataTable`, `jim`, `dev`;
  add any new ones).
- If D2=yes: also export a `chartTypeDefaults` table (chart type → overridden paths/values).

New `docs/templates/config.tpl`: clone the old `settingsObj.tpl` table layout
(Setting Path / Description / Default / Type, per category + type glossary).

Sidebar: add `{ text: 'Config', link: '/config' }` under Developer Guide in
`docs/.vitepress/config.ts`.

## Phase 3 — Keep doc comments and docs in sync (source of truth)

- Descriptions are edited **only** in `lib/config/**/*.json`; then run
  `python3 lib/config/build_settings.py lib/config` to regenerate `config_types.ts`
  (doc comments), `config_defaults.ts`, `config_metadata.ts`. Never hand-edit generated
  files. Document this in the config page header template.
- `build_settings.py` currently **silently skips** settings lacking a `description`
  (they vanish from the types and the docs). Add a warning to `build_settings.py` (or a
  coverage report in `config.ts`) listing any setting without a description, so gaps are
  visible instead of silent.

## Phase 4 — Framework improvements (docs generation itself)

1. **Fail fast in CI:** make `buildDocs.ts` record per-template failures and exit non-zero
   at the end (or add a `--strict` flag used by `docs:build`), so a broken script fails
   the deploy workflow instead of publishing an empty page.
2. **Prune legacy `npm run doc`:** either delete the api-documenter script or redirect its
   output to `docs/api/` and link it in the sidebar deliberately. (api-extractor must keep
   running regardless — `paraapi.ts` needs `temp/paracharts.api.json`.)
3. **PR-level check:** add `npm run docs:generate` (or `docs:build`) to
   `build-and-test.yml` for changes touching `lib/config/`, `docs/`, or
   `lib/state/action_map.json`, so breakage is caught before `main`.
4. **Sidebar automation (optional, low priority):** derive sidebar entries from the
   templates dir instead of hand-editing `docs/.vitepress/config.ts`. Only worth it if
   more generated pages are expected; adding a page today is already just
   "one `.tpl` + one `.ts` + one sidebar line".
5. **Shared table helper (only if a second consumer appears):** don't preemptively
   abstract; if a third settings-like page shows up, extract the path-walk/table context
   logic from `config.ts` into `docs/scripts/lib/`.

## Phase 5 — Verification

- `npm run docs:generate` → `docs/config.md` generated with expected categories
  (color, chart, axis, legend, type, …) and no console errors.
- Coverage check: every non-hidden leaf in `defaultConfig` appears exactly once in
  `docs/config.md` (script prints a count; compare against a walk of `defaultConfig`).
- `npm run docs:build` succeeds; spot-check rendered tables in `docs/.vitepress/dist`.
- `python3 lib/config/build_settings.py lib/config` is idempotent (no diff on rerun).
- Confirm `settingsObj` references are gone from sidebar and no inbound links remain.

## Out of scope

- Exporting `Config`/`defaultConfig` from the package entry point and adding `@public`
  tags to generated interfaces for API-reference docs (D3).
- Restructuring the config JSON schema (e.g. adding an explicit `range` field); the docs
  script works with what exists today.
