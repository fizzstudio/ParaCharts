import fs from 'fs';
import path from 'path';

const [, , source, targetDirectory] = process.argv;
if (!source || !targetDirectory) {
  throw new Error('Usage: stageApiModel <api-json-file> <target-directory>');
}

const sourcePath = path.resolve(source);
const targetPath = path.resolve(targetDirectory);
if (!fs.statSync(sourcePath).isFile()) {
  throw new Error(`API model source is not a file: ${sourcePath}`);
}

fs.rmSync(targetPath, { recursive: true, force: true });
fs.mkdirSync(targetPath, { recursive: true });
fs.copyFileSync(sourcePath, path.join(targetPath, path.basename(sourcePath)));
