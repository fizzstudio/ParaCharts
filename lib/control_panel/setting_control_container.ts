
import { ParaComponent } from '../components';
import { logging } from '../common/logger';
import '../components';

import { StateController } from '@lit-app/state';

export abstract class SettingControlContainer extends logging(ParaComponent) {

  protected _controlsState!: StateController;
  
  connectedCallback() {
    super.connectedCallback();
    this._controlsState = new StateController(this, this._store.settingControls);
  }

}

