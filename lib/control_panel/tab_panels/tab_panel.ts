
import { SettingControlContainer } from '../setting_control_container';
import { type ParaControlPanel } from '..';

import { css } from 'lit';

export abstract class ControlPanelTabPanel extends SettingControlContainer {

  _controlPanel!: ParaControlPanel;

  get controlPanel() {
    return this._controlPanel;
  }

  set controlPanel(controlPanel: ParaControlPanel) {
    this._controlPanel = controlPanel;
    // also creates the state controller
    this.store = controlPanel.store;
  }
  
  static styles = [
    css`
      .tab-content {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        padding: 0.2rem;
      }

      .tab-content.stacked {
        flex-direction: column;
        gap: 0.1rem;
        align-items: flex-start;
        justify-content: space-between;
        padding: 0.5rem 0.2rem;
      }
    `
  ];

}

