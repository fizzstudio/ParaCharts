import { BaseState } from './base_state';
import { ParaState } from './parastate';
import { SettingsInput } from '../config/config_types';

import { property } from '@lit-app/state';

// import { Localization } from '@elemental/localization';
import { Localization } from '../l10n/l10n';

export class GlobalState extends BaseState {
  protected _paraStates: ParaState[] = [];
  @property() protected _currentParaState!: ParaState;
  protected _l10n!: Localization;

  constructor(
    protected _inputSettings: SettingsInput,
    // suppleteSettingsWith?: DeepReadonly<Settings>
  ) {
    super();
    // this._createSettings(_inputSettings);
    // this._getUrlAnnotations();
  }

  init() {
    // this._l10n = await Localization.make(navigator.languages, {defaultLocale: 'en', path: '/lib/assets/locales'});
    this._l10n = new Localization();
  }

  get paraState(): ParaState {
    return this._currentParaState;
  }

  get paraStates(): readonly ParaState[] {
    return this._paraStates;
  }

  get l10n(): Localization {
    return this._l10n;
  }

  createParaState() {
    this._paraStates.push(
      new ParaState(
        this,
        this._inputSettings));
    this._currentParaState = this._paraStates.at(-1)!;
  }

  enableParaState(paraState: ParaState) {
    this._currentParaState = paraState;
  }

}

