
import { type ParaState, type GlobalState } from '../state';

import { LitElement } from 'lit';
import { State, StateController } from '@lit-app/state';

export class ParaComponent extends LitElement {
  protected _globalState!: GlobalState;
  protected _globalStateController!: StateController<GlobalState>;
  protected _paraStateController!: StateController<ParaState>;


  get globalState() {
    return this._globalState;
  }

  set globalState(globalState: GlobalState) {
    if (!this._globalState) {
      this._globalState = globalState;
      this._globalStateController = new StateController(this, globalState);
      this._paraStateController = new StateController(this, globalState.paraState);
    }
  }

  get _paraState(): ParaState {
    return this._globalState.paraState;
  }

  extractStyles(id: string) {
    const stylesheets = this.shadowRoot!.adoptedStyleSheets;
    const out: string[] = [];
    for (const stylesheet of stylesheets) {
      const rules = stylesheet.cssRules;
      for (let i = 0; i < rules.length; i++) {
        const rule = rules.item(i) as CSSRule;
        out.push(rule.cssText.replace(/^:host/, `#${id}`));
      }
    }
    return out.join('\n');
  }

}