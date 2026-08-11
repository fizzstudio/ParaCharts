import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import mustache from 'mustache';
import { replaceGeneratedDirectory } from './replaceGeneratedDir.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.resolve(__dirname, '..', 'templates');
const scriptsDir = path.resolve(__dirname);
const outDir = path.resolve(__dirname, '..');
const manifestPath = path.join(outDir, '.generated-pages.json');

interface OutputPage {
    outputPath: string;
    context: any;
}

interface TemplateJob {
    file: string;
    template: string;
    context: any;
    pages?: OutputPage[];
    cleanOutputDirectories?: string[];
}

interface RenderedPage {
    outputPath: string;
    absolutePath: string;
    content: string;
}

async function buildDocs() {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.tpl'));
    const failures: Array<{ file: string; error: unknown }> = [];
    const jobs: TemplateJob[] = [];

    for (const file of files) {
        try {
            const name = path.basename(file, '.tpl');
            const tplPath = path.join(templatesDir, file);
            const scriptModulePath = path.join(scriptsDir, `${name}.ts`);
            let context: any = {};
            let pages: OutputPage[] | undefined;
            let cleanOutputDirectories: string[] | undefined;

            if (fs.existsSync(scriptModulePath)) {
                const fileUrl = pathToFileURL(scriptModulePath).href;
                const imported = await import(fileUrl);
                if (imported?.default) context = imported.default;
                if (imported?.pages) pages = imported.pages;
                if (imported?.cleanOutputDirectories) cleanOutputDirectories = imported.cleanOutputDirectories;
            }

            jobs.push({
                file,
                template: fs.readFileSync(tplPath, 'utf8'),
                context,
                pages,
                cleanOutputDirectories
            });
        } catch (err) {
            console.error(`Error loading template ${file}:`, err);
            failures.push({ file, error: err });
        }
    }

    const cleanOutputDirectories = Array.from(new Set(jobs.flatMap(job => job.cleanOutputDirectories ?? [])));
    for (const directory of cleanOutputDirectories) {
        const directoryPath = path.resolve(outDir, directory);
        if (!directoryPath.startsWith(`${outDir}${path.sep}`)) {
            throw new Error(`Refusing to clean output directory outside docs: ${directory}`);
        }
    }

    const renderedPages: RenderedPage[] = [];
    for (const job of jobs) {
        try {
            const name = path.basename(job.file, '.tpl');
            const outputPages = job.pages ?? [{ outputPath: `${name}.md`, context: job.context }];
            for (const page of outputPages) {
                const outPath = path.resolve(outDir, page.outputPath);
                if (!outPath.startsWith(`${outDir}${path.sep}`) || !outPath.endsWith('.md')) {
                    throw new Error(`Invalid documentation output path: ${page.outputPath}`);
                }
                const rendered = mustache.render(job.template, page.context, {}, {
                // we don't want to apply HTML escaping, so just return the string unchanged
                    escape: (text: string) => text
                });

                renderedPages.push({ outputPath: page.outputPath, absolutePath: outPath, content: rendered });
            }
        } catch (err) {
            console.error(`Error processing template ${job.file}:`, err);
            failures.push({ file: job.file, error: err });
        }
    }

    if (failures.length > 0) {
        throw new Error(`Failed to generate ${failures.length} documentation page(s): ${failures.map(({ file }) => file).join(', ')}`);
    }

    const pagesInCleanDirectories = new Set<RenderedPage>();
    for (const directory of cleanOutputDirectories) {
        const directoryPrefix = `${directory}/`;
        const directoryPages = renderedPages.filter(page => page.outputPath.startsWith(directoryPrefix));
        const stagingPath = path.resolve(outDir, `.${directory.replaceAll(path.sep, '-')}-staging`);
        fs.rmSync(stagingPath, { recursive: true, force: true });
        fs.mkdirSync(stagingPath, { recursive: true });

        for (const page of directoryPages) {
            pagesInCleanDirectories.add(page);
            const stagedPath = path.join(stagingPath, page.outputPath.slice(directoryPrefix.length));
            fs.mkdirSync(path.dirname(stagedPath), { recursive: true });
            fs.writeFileSync(stagedPath, page.content, 'utf8');
        }

        replaceGeneratedDirectory(stagingPath, path.resolve(outDir, directory));
    }

    for (const page of renderedPages) {
        if (pagesInCleanDirectories.has(page)) continue;
        fs.mkdirSync(path.dirname(page.absolutePath), { recursive: true });
        fs.writeFileSync(page.absolutePath, page.content, 'utf8');
    }

    const currentOutputs = renderedPages.map(page => page.outputPath).sort();
    const previousOutputs: string[] = fs.existsSync(manifestPath)
        ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        : [];
    for (const staleOutput of previousOutputs.filter(output => !currentOutputs.includes(output))) {
        const stalePath = path.resolve(outDir, staleOutput);
        if (!stalePath.startsWith(`${outDir}${path.sep}`) || !stalePath.endsWith('.md')) {
            throw new Error(`Invalid stale documentation path: ${staleOutput}`);
        }
        fs.rmSync(stalePath, { force: true });
    }
    fs.writeFileSync(manifestPath, `${JSON.stringify(currentOutputs, null, 2)}\n`, 'utf8');

    for (const page of renderedPages) console.log(`Wrote ${page.absolutePath}`);
}

buildDocs().catch(err => {
    console.error(err);
    process.exit(1);
});
