# ParaCharts

The open-source, truly accessible ParaCharts charting software by Fizz Studio

## Build Process

### Building the basic version 

Run `npm run build` to build the ParaCharts library. The bundled files will be in the `dist` folder.

### Building the AI-enhanced version (currenly only available internally)

Run `npm run build:ai` to build the AI-enhanced version ParaCharts library. The bundled files will be in the `dist-ai` folder.

Note the following about the AI-enhanced version build:
- The basic and AI-enhanced version build processes have separate config files for Vite, TypeScript, and API-Extractor: `ai.api-extractor.json, ai.tsconfig.json, ai.vite.config.ts`. Any change made to the basic version of one of these files must be made to the AI-enhanced version, and vice versa, unless it is a reference to the file paths being used which different between the versions
- Only the basic version in the `dist` folder is published to the Fizz NPM
- Currently, the basic ParaChart element has the tag `<para-chart>` and the AI-enhanced ParaChart element has the tag `<para-chart-ai>` 
- `lib-ai/index-ai.ts` is the entry point for the AI-enhanced version. Anything which should be exported by the AI-enhanced version, but not the basic version, should be exported in this file. Any additional TypeScript files which shouldn't/needn't be built into the basic version should be in the `lib-ai` folder.
- Private dependencies which are only required for the AI-enhanced version are set as optionalDependencies. These dependencies are installed if they can be found, but are otherwise ignored.
