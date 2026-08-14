# ParaCharts

The open-source, truly accessible ParaCharts charting software by Fizz Studio

## Build Process

### Building the basic version

Run `npm run build` to build the ParaCharts library. The bundled files will be in the `dist` folder.

### Building the AI-enhanced version (currently only available internally)

Run `npm run build:ai` to build the AI-enhanced version ParaCharts library. The bundled files will be in the `dist-ai` folder.

Note the following about the AI-enhanced version build:
- The basic and AI-enhanced build processes have separate config files for Vite, TypeScript, and API Extractor: `ai.vite.config.ts`, `ai.tsconfig.json`, and `ai.api-extractor.json`. Keep equivalent settings synchronized unless a difference is specific to their entry points or output paths.
- Only the basic version in the `dist` folder is published to the Fizz NPM
- Currently, the basic ParaChart element has the tag `<para-chart>` and the AI-enhanced ParaChart element has the tag `<para-chart-ai>`.
- `lib-ai/index-ai.ts` is the entry point for the AI-enhanced version. Anything which should be exported by the AI-enhanced version, but not the basic version, should be exported in this file. Any additional TypeScript files which shouldn't/needn't be built into the basic version should be in the `lib-ai` folder.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, validation, and contribution guidance.

To work on the documentation site, run `npm run docs:dev`. To verify a production documentation build, run `npm run docs:build`. The full maintenance guide is in [contributing/documentation.md](contributing/documentation.md).
