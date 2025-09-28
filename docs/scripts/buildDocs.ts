import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import mustache from 'mustache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.resolve(__dirname, '..', 'templates');
const scriptsDir = path.resolve(__dirname);
const outDir = path.resolve(__dirname, '..', 'markdown');

async function buildDocs() {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const files = fs.readdirSync(templatesDir);

    for (const file of files) {
        try {
            if (!file.endsWith('.tpl')) continue;

            const name = path.basename(file, '.tpl');
            const tplPath = path.join(templatesDir, file);
            const scriptModulePath = path.join(scriptsDir, `${name}.ts`);

            let context: any = {};

            if (fs.existsSync(scriptModulePath)) {
                const fileUrl = pathToFileURL(scriptModulePath).href;
                const imported = await import(fileUrl);
                if (imported && imported.default) {
                    context = imported.default;
                }
            }

            const tpl = fs.readFileSync(tplPath, 'utf8');
            const rendered = mustache.render(tpl, context);

            const outPath = path.join(outDir, `${name}.md`);
            fs.writeFileSync(outPath, rendered, 'utf8');
            console.log(`Wrote ${outPath}`);
        } catch (err) {
            console.error(`Error processing template ${file}:`, err);
        }
    }
}

buildDocs().catch(err => {
    console.error(err);
    process.exit(1);
});
