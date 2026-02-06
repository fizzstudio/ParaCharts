import { BaseState } from './base_state';
import { ParaState } from './parastate';
import { SettingsInput, Setting } from './settings_types';

import { SeriesAnalyzerConstructor, PairAnalyzerConstructor } from '@fizz/paramodel';

import { property } from '@lit-app/state';

export class GlobalState extends BaseState {
  protected _paraStates: ParaState[] = [];
  protected _currentParaState!: ParaState;

  constructor(
    protected _inputSettings: SettingsInput,
    // suppleteSettingsWith?: DeepReadonly<Settings>,
    protected _seriesAnalyzerConstructor?: SeriesAnalyzerConstructor,
    protected _pairAnalyzerConstructor?: PairAnalyzerConstructor
  ) {
    super();
    this._createSettings(_inputSettings);
    // this._getUrlAnnotations();
  }

  get paraState(): ParaState {
    return this._currentParaState;
  }

  get paraStates(): readonly ParaState[] {
    return this._paraStates;
  }

  createParaState() {
    this._paraStates.push(
      new ParaState(
        this,
        this._inputSettings,
        this._seriesAnalyzerConstructor,
        this._pairAnalyzerConstructor));
    this._currentParaState = this._paraStates.at(-1)!;
  }

  enableParaState(paraState: ParaState) {
    this._currentParaState = paraState;
  }

}

