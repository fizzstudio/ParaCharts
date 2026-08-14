# Contributing to ParaCharts

ParaCharts uses private Fizz packages. Ask a maintainer for an `NPM_AUTH_TOKEN`, export it in your shell, and add this entry to your user-level `~/.npmrc`:

```ini
//npm.fizz.studio/:_authToken=${NPM_AUTH_TOKEN}
```

Do not put the token itself in a repository file.

## Setup

ParaCharts CI uses Node.js 20. The configuration generator also requires Python 3.

```sh
npm ci
```

Use `npm run dev` for Storybook development and `npm run build` for a production library build.

## Before a Pull Request

Run the checks relevant to your change. For changes that cross multiple areas, run the full set:

```sh
npm run build
npm run build:ai
npm run test:unit
npm run test:browser
npm run build-storybook
npm run docs:build
npm run docs:check
npm pack --dry-run
```

Review changes to tracked generated files before committing. In particular, `etc/paracharts.api.md` and `etc/paracharts.ai.api.md` represent the public API surfaces and should change only when those surfaces change.

## Documentation

See [contributing/documentation.md](contributing/documentation.md) for documentation architecture, file ownership, commands, and recipes for adding guides, public modules, configuration groups, and generated pages.
