//import { styles } from '../../styles';
import { ControlPanelTabPanel } from './tab_panel';
import { AdvancedControlSettingsDialog } from '../dialogs';
import { AnimationDialog } from '../dialogs';
import { actionMap } from '../../state/action_map';

import {
  html, css,
} from 'lit';
import { customElement } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';


@customElement('para-controls-panel')
export class ControlsPanel extends ControlPanelTabPanel {

  protected _advancedControlDialogRef = createRef<AdvancedControlSettingsDialog>();
  protected _animationDialogRef = createRef<AnimationDialog>();

  static styles = [
    ...ControlPanelTabPanel.styles,
    css`
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    this._paraState.settingControls.add({
      type: 'button',
      key: 'ui.isFullscreenEnabled',
      label: 'Fullscreen',
      parentView: 'controlPanel.tabs.controls.fullscreen',
    });
    this._paraState.settingControls.add({
      type: 'checkbox',
      key: 'animation.isAnimationEnabled',
      label: 'Animation enabled',
      parentView: 'controlPanel.tabs.controls.animation',
    });
  }

  protected _getHelp() {
    // TODO: update help dialog with user-defined key map
    return html`
      <p>ParaCharts is an accessible data visualization app with multimodal features for different disabilities. You can explore it using the mouse, touchscreen, or keyboard.</p>
      <ul>
        <li>Navigate using the arrow keys:
          <ul>
            <li><b>Right or left arrow keys</b>: move to the next or previous data point in this series</li>
            <li><b>Up or down arrow keys</b>: move to the previous or next data series</li>
          </ul>
        </li>
        <li><b>Enter key</b>: select current data point</li>
        <li><b>Shift + Enter key</b>: add current data point to selection</li>
        <li><b>Q key</b>: get more information about this data point or series, and compare selected data points</li>
        <li><b>S key</b>: toggle sonification on or off</li>
        <li><b>V key</b>: toggle self-voicing on or off</li>
        <li><b>L key</b>: low vision mode</li>
        <li><b>C key</b>: chord mode</li>
        <li>High/low jump keys:
          <ul>
            <li><b>] (right bracket) key</b>: jump to the highest data point in this series</li>
            <li><b>Shift + ] (right bracket) key</b>: jump to the highest data point in the chart</li>
            <li><b>[ (left bracket) key</b>: jump to the lowest data point in this series</li>
            <li><b>Shift + [ (left bracket) key</b>: jump to the lowest data point in the chart</li>
          </ul>
        </li>
        <li><b>Escape key</b> or <b>Control key</b>: stop speaking</li>
        <li><b>H key</b>: open this Help dialog</li>
      </ul>

      <p>Explore the collapsible Control Panel to find many more accessibility features, including options for color blindness, dark mode with fine-grained contrast, self-voicing, SparkBraille tactile support, and more.</p>

      <p>For more details, visit the <a href="https://fizzstudio.github.io/paracharts" target="_blank">ParaCharts Documentation</a>.</p>
    `;
  }

  showHelpDialog() {
    this.controlPanel.dialog.show('Help', this._getHelp());
  }

  protected _getKeyTable() {
    return html`
      <table>
        <tbody>
          ${Object.entries(actionMap).map(([action, info]) => html`
              <tr>
                <th scope="row">${info.label}</th>
                <td>${info.hotkeys}</td>
                <td><button disable>edit</button></td>
              </tr>
            `)
      }
        </tbody>
      </table>
    `;
  }

  render() {
    return html`
      <div id="controls-tab" class="tab-content">
        <div>
          <button
            @click=${() => this.controlPanel.dialog.show('Key Bindings', this._getKeyTable())}
          >
            Keyboard Controls
          </button>
          <button
            @click=${() => this._paraState.updateSettings(draft => {
              draft.ui.isFullscreenEnabled = true;
            })}
          >
            Fullscreen
          </button>
        </div>

        <div>
          ${this._paraState.settingControls.getContent('controlPanel.tabs.controls')}
        </div>

        <section id="animation">
          ${this._paraState.settingControls.getContent('controlPanel.tabs.controls.animation')}
          <button
            @click=${() => {
        this._animationDialogRef.value?.show()
      }}
          >
            Animation settings
          </button>
          <para-animation-dialog
            ${ref(this._animationDialogRef)}
            id="animation-settings-dialog"
            .globalState=${this._globalState}
          >
          </para-animation-dialog>
        </section>

        <section id="advanced">
          <button
            @click=${() => this.showHelpDialog()}
          >
            Help
          </button>
          <button
            @click=${() => this._advancedControlDialogRef.value?.show()}
          >
          Advanced Controls
          </button>
        </section>
      </div>
      <div id="file-save-placeholder" style="display: none;">
      </div>
      <para-advanced-control-settings-dialog
        ${ref(this._advancedControlDialogRef)}
        id="advanced-control-settings-dialog"
        .globalState=${this._globalState}
      ></para-advanced-control-settings-dialog>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'para-controls-panel': ControlsPanel;
  }
}