import { Logger, getLogger } from '../common/logger';
import { ParaStore } from '../store';

export class ParaViewController extends ParaView {
  private log: Logger = getLogger("ParaViewController");
  constructor(protected _store: ParaStore) {
    super();
  }
  handleKeyEvent(event: KeyboardEvent) {
    if (this._store.settings.chart.isStatic) {
      return;
    }
    let key = event.key === 'Control' ? 'Ctrl' : event.key.toLocaleLowerCase();
    let mods = [
      event.altKey ? 'Alt' : '',
      event.ctrlKey ? 'Ctrl' : '',
      event.shiftKey ? 'Shift' : '',
      event.metaKey ? 'Meta' : '',
    ].filter(mod => mod);
    if (mods.includes(key)) {
      key = '';
    }
    const keyId = (key ? [...mods, key] : mods).join('+');
    // if (this._store.paraChart.command('key', [keyId])) {
    if (this._store.keymapManager.onKeydown(keyId)) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

}