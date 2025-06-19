
import { Logger } from '../common/logger';
import { ParaStore } from '../store';

export class ParaViewController extends Logger {

  constructor(protected _store: ParaStore) {
    super();
  }

  logName() {
    return 'ParaViewController';
  }

  handleKeyEvent(event: KeyboardEvent) {
    let key = event.key === 'Control' ? 'Ctrl' : event.key; 
    let mods = [ 
      event.altKey ? 'Alt' : '',
      event.ctrlKey ? 'Ctrl' : '',
      event.shiftKey ? 'Shift' : '',
    ].filter(mod => mod);
    if (mods.includes(key)) {
      key = '';
    }
    const keyId = (key ? [...mods, key] : mods).join('+');
    if (this._store.keymapManager.onKeydown(keyId)) {
      event.stopPropagation();
      event.preventDefault();
    }
  }
  
}