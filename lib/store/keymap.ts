import { type KeyRegistrations } from './keymap_manager';
import keymapJson from './keymap.json' with { type: 'json' };

export const keymap: KeyRegistrations = keymapJson as KeyRegistrations;

