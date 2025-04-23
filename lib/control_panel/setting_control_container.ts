
import { ParaComponent } from '../paracomponent';
import { logging } from '../common/logger';
import '../components';

import { StateController } from '@lit-app/state';

export abstract class SettingControlContainer extends logging(ParaComponent) {

  protected _storeState!: StateController;
  protected _controlsState!: StateController;
  
  connectedCallback() {
    super.connectedCallback();
    this._storeState = new StateController(this, this._store);
    this._controlsState = new StateController(this, this._store.settingControls);
  }

}

