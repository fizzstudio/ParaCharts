
import { type Setting, SettingsManager } from '.';
import { Logger, getLogger } from '@fizz/logger';
import { 
  type SettingControlType,
  type SettingControl,
  type SettingControlValueType,
  type TextfieldSettingControlOptions,
  type DropdownSettingControlOptions,
  type CheckboxSettingControlOptions,
  type RadioSettingControlOptions,
  type SliderSettingControlOptions,
  type ButtonSettingControlOptions,
} from '../components/settings';
import { ParaStore } from './parastore';

import { type TemplateResult } from 'lit';
import { html, literal } from 'lit/static-html.js';
import { State, property } from '@lit-app/state';
import { produce } from 'immer';
import { strToId } from '@fizz/paramanifest';


export type SettingControlOptionsType<T extends SettingControlType> = 
  T extends 'textfield' ? TextfieldSettingControlOptions : 
  T extends 'dropdown' ? DropdownSettingControlOptions :
  T extends 'checkbox' ? CheckboxSettingControlOptions :
  T extends 'radio' ? RadioSettingControlOptions :
  T extends 'slider' ? SliderSettingControlOptions :
  T extends 'button' ? ButtonSettingControlOptions :
  never;

type SettingValidationResult = {err?: string};
 
/**
 * Options supplied when creating a setting control.
 * @public
 */
export interface SettingControlOptions<T extends SettingControlType = SettingControlType> {
  /** Dotted path to the setting in the setting tree. */
  key: string;
  /** Label displayed for the control. */
  label: string;
  /** Control type. */
  type: T;
  /** Type-specific options. */
  options?: SettingControlOptionsType<T>;
  /** Optional initial control value (defaults to setting value). */
  value?: SettingControlValueType<T>;
  /** Optional function for validating input. */
  validator?: (value: Setting) => SettingValidationResult;
  /** Whether control is initially hidden. */
  hidden?: boolean;
  /** Tag indicating where the setting control will be displayed. */
  parentView: string;
}

/**
 * Info stored about a setting control.
 * @internal
 */
export interface SettingControlInfo<T extends SettingControlType = SettingControlType> {
  /** Dotted path to the setting in the setting tree. */
  key: string;
  /** Setting control element reference. */
  //settingControlRef: Ref<SettingControl<T>>;
  /** Rendered DOM content for the control. */
  render: () => TemplateResult;
  /** Tag indicating where the setting control will be displayed. */
  parentView: string;
  /** Type-specific options. */
  options?: SettingControlOptionsType<T>;
  /** Optional function for validating input. */
  validator?: (value: Setting) => SettingValidationResult;
}

const inputTypeTags = {
  textfield: literal`para-textfield-setting-control`,
  dropdown: literal`para-dropdown-setting-control`,
  checkbox: literal`para-checkbox-setting-control`,
  radio: literal`para-radio-setting-control`,
  slider: literal`para-slider-setting-control`,
  button: literal`para-button-setting-control`
}

/**
 * Manages setting control information.
 */
export class SettingControlManager extends State {
  protected log: Logger = getLogger("SettingControlManager");
  
  @property() protected _settingControlInfo: {[key: string]: SettingControlInfo} = {};

  constructor(protected _store: ParaStore) {
    super();
  }

  add<T extends SettingControlType>(
    controlOptions: SettingControlOptions<T>
  ) {
    this._settingControlInfo = produce(this._settingControlInfo, draft => {
      const controlInfo: Partial<SettingControlInfo<T>> = {};
      const tag = inputTypeTags[controlOptions.type];
      controlInfo.key = controlOptions.key;
      controlInfo.parentView = controlOptions.parentView;
      //controlInfo.settingControlRef = createRef();
      controlInfo.options = controlOptions.options;
      controlInfo.validator = controlOptions.validator;
      controlInfo.render = () => html`
        <${tag}
          .value=${controlOptions.value ?? SettingsManager.get(controlOptions.key, this._store.settings)}
          .label=${controlOptions.label}
          .info=${controlInfo}
          .store=${this._store}
          ?hidden=${controlOptions.hidden}
          id="setting-${strToId(controlOptions.key)}"
        ></${tag}>
      `;
      draft[controlOptions.key] = controlInfo as SettingControlInfo;  
    });
  }

  info(key: string) {
    return this._settingControlInfo[key];
  }

  // value<T extends Setting>(key: string) {
  //   const controlInfo = this.info(key);
  //   if (!controlInfo) {
  //     throw new Error(`no setting control info for key '${key}'`);
  //   }
  //   return controlInfo.settingControlRef.value!.value as T;
  // }

  // setVisible(key: string, visible: boolean) {
  //   const controlInfo = this.info(key);
  //   if (!controlInfo) {
  //     throw new Error(`no setting control info for key '${key}'`);
  //   }
  //   if (visible) {
  //     controlInfo.settingControlRef.value!.removeAttribute('hidden');
  //   } else {
  //     controlInfo.settingControlRef.value!.setAttribute('hidden', 'hidden');
  //   }
  // }

  getContent(parentView: string) {
    return Object.values(this._settingControlInfo)
      .filter(settingInfo => settingInfo.parentView === parentView) 
      .map(settingInfo => settingInfo.render());
  }

  /**
   * Update the control (if any) for a setting with a new value.
   * @returns Setting keys.
   */
  // update(key: string, value: Setting | undefined) {
  //   const controlInfo = this._settingControlInfo[key];
  //   if (controlInfo) {
  //     const control = controlInfo.settingControlRef.value!;
  //     if (control) {
  //       control.value = value;
  //     }
  //   } else {
  //     this.log.info(`no setting control for key '${key}'`);
  //   }
  // }

  // updateOptions(key: string, options: SettingControlOptionsType<any>) {
  //   const controlInfo = this._settingControlInfo[key];
  //   if (controlInfo) {
  //     const control = controlInfo.settingControlRef.value!;
  //     if (control) {
  //       if (!controlInfo.options) {
  //         controlInfo.options = {};
  //       }
  //       for (const prop in options) {
  //         const key = prop as keyof typeof options;
  //         controlInfo.options[key] = options[key];
  //       }
  //       control.requestUpdate();
  //     }
  //   } else {
  //     this.log.info(`no setting control for key '${key}'`);
  //   }
  // }
  
}