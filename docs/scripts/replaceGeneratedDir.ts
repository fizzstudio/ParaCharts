import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function replaceGeneratedDirectory(source: string, target: string): void {
  const sourcePath = path.resolve(source);
  const targetPath = path.resolve(target);
  const backupPath = `${targetPath}.backup-${process.pid}`;

  if (!fs.statSync(sourcePath).isDirectory()) {
    throw new Error(`Generated source is not a directory: ${sourcePath}`);
  }

  fs.rmSync(backupPath, { recursive: true, force: true });
  if (fs.existsSync(targetPath)) fs.renameSync(targetPath, backupPath);

  try {
    fs.renameSync(sourcePath, targetPath);
    fs.rmSync(backupPath, { recursive: true, force: true });
  } catch (error) {
    if (fs.existsSync(backupPath) && !fs.existsSync(targetPath)) {
      fs.renameSync(backupPath, targetPath);
    }
    throw error;
  }
}

const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (scriptPath === fileURLToPath(import.meta.url)) {
  const [, , source, target] = process.argv;
  if (!source || !target) throw new Error('Usage: replaceGeneratedDir <source> <target>');
  replaceGeneratedDirectory(source, target);
}
