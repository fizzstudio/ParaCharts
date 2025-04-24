
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
    const keyId = [ 
      event.altKey ? 'Alt+' : '',
      event.ctrlKey ? 'Ctrl+' : '',
      event.shiftKey ? 'Shift+' : '',
      event.key
    ].join('');
    if (this._store.keymapManager.onKeydown(keyId)) {
      event.stopPropagation();
      event.preventDefault();
    }
  }
  
}