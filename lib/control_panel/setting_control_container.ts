import { Logger, getLogger } from '../common/logger';
import { ParaComponent } from '../components';
import '../components';

import { StateController } from '@lit-app/state';

export abstract class SettingControlContainer extends ParaComponent {
  private log: Logger = getLogger("SettingControlContainer");
  protected _controlsState!: StateController;
  
  connectedCallback() {
    super.connectedCallback();
    this._controlsState = new StateController(this, this._store.settingControls);
  }

}

