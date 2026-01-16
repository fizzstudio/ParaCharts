import { Logger, getLogger } from '@fizz/logger';
import { ParaState } from '../state';

export class ParaViewController {
  protected log: Logger = getLogger("ParaViewController");
  constructor(protected _paraState: ParaState) {}
  handleKeyEvent(event: KeyboardEvent) {
    if (this._paraState.settings.chart.isStatic) {
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
    // if (this._paraState.paraChart.command('key', [keyId])) {
    if (this._paraState.keymapManager.onKeydown(keyId)) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

}