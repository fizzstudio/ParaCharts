import { Logger, getLogger } from '@fizz/logger';
import { ParaComponent } from '../../components';
import { type SettingControlInfo, type Setting, SettingsManager } from '../../store';
//import { styles } from '../styles';

import '@fizz/ui-components';

import { html, css, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';


export type SettingControlType = 'textfield' | 'dropdown' | 'checkbox' | 'radio' | 'slider' | 'button';

export type SettingControlValueType<T extends SettingControlType> =
  T extends 'textfield' ? string | number :
  T extends 'dropdown' ? string :
  T extends 'checkbox' ? boolean :
  T extends 'radio' ? string :
  T extends 'slider' ? number :
  T extends 'button' ? boolean :
  never;

export abstract class SettingControl<T extends SettingControlType> extends ParaComponent {
  private log: Logger = getLogger("SettingControl");
  @state() label!: string;

  @state()
  set value(value: SettingControlValueType<T>) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

  @property({type: Boolean}) hidden = false;

  info!: SettingControlInfo<T>;

  protected _value!: SettingControlValueType<T>;

  static styles = [
    //styles,
    css`
    `
  ];

  protected _updateSetting(key: string, value: SettingControlValueType<SettingControlType>) {
    this._store.updateSettings(draft => SettingsManager.set(key, value, draft));
  }

  protected _validateInput(value: Setting, control: EventTarget) {
    //this.log.info('validating', controlInfo.key, value);
    if (this.info.validator) {
      const result = this.info.validator(value);
      if (result.err) {
        control.dispatchEvent(
          new CustomEvent(
            'invalidvalue', {bubbles: true, composed: true, detail: result.err}));
        return false;
      }
    }
    return true;
  }

  protected abstract content(): TemplateResult;

  protected render() {
    return html`
      <div
        class="setting"
      >
        ${this.content()}
      </div>
    `;
  }

}
