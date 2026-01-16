import keymap from '../../lib/state/keymap.json' with { type: 'json' };

function keymapTable() {
    let table = [`| Key / Shortcut         | Description                                      |
|------------------------|--------------------------------------------------|`];

    for (const key of Object.keys(keymap) as Array<keyof typeof keymap>) {
        if (keymap.hasOwnProperty(key)) {
            table.push(
                `| ${key.padEnd(22)} | ${(keymap[key].label || '').padEnd(50)} |`
            );
        }
    }
    return table.join('\n');
}

export default { keymapTable };
