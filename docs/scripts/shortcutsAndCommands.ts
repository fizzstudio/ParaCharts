import keymap from '../../lib/state/action_map.json' with { type: 'json' };

function keymapTable() {
    let table = [`| Key / Shortcut | Description |
|---|---|`];

    for (const key of Object.keys(keymap) as Array<keyof typeof keymap>) {
        if (keymap.hasOwnProperty(key)) {
            const action = keymap[key];
            const hotkeys = Array.isArray(action.hotkeys) ? action.hotkeys.map(hotkey => {
                if (typeof hotkey === 'string') {
                    return hotkey;
                } else if (hotkey && typeof hotkey === 'object' && 'keyID' in hotkey) {
                    return hotkey.keyID;
                } else {
                    return '';
                }
            }).filter(h => h).join(', ') : '';
            if (hotkeys.trim()) {
                table.push(
                    `| **${hotkeys}** | ${action.label || ''} |`
                );
            }
        }
    }
    return table.join('\n');
}

export default { keymapTable };
