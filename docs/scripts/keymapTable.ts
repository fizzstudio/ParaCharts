import { keymap } from '../../lib/store/keymap.ts';

let table = [`| Key / Shortcut         | Description                                      |
|------------------------|--------------------------------------------------|`];

for (const key in keymap) {
    if (keymap.hasOwnProperty(key)) {
        table.push(
            `| ${key.padEnd(22)} | ${(keymap[key].label || '').padEnd(50)} |`
        );
    }
}

console.log(table.join('\n'));

