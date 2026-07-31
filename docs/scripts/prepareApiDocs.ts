import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(process.argv[2] ?? path.resolve(scriptDir, '../api'));

for (const file of fs.readdirSync(docsDir)) {
  if (!file.endsWith('.md')) continue;

  const filePath = path.join(docsDir, file);
  const markdown = fs.readFileSync(filePath, 'utf8');
  // API Documenter inserts empty comments as separators, but Vue can parse them as
  // malformed template markup when they occur in object types inside HTML tables.
  const vitePressSafeMarkdown = markdown
    .replaceAll('<!-- -->', '')
    .replace(/^\{(.+)\}\r?$/gm, '&#123;$1&#125;');
  fs.writeFileSync(filePath, vitePressSafeMarkdown, 'utf8');
}
