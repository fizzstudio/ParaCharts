
import { type ParaState, type GlobalState } from '../state';

import { LitElement } from 'lit';
import { State, StateController } from '@lit-app/state';

export class ParaComponent extends LitElement {
  protected _globalState!: GlobalState;
  protected _globalStateController!: StateController<GlobalState>;
  protected _paraStateController!: StateController<ParaState>;
  protected _explainerStateController!: StateController<ParaState>;

  get globalState() {
    return this._globalState;
  }

  set globalState(globalState: GlobalState) {
    if (!this._globalState) {
      this._globalState = globalState;
      this._globalStateController = new StateController(this, globalState);
      this._paraStateController = new StateController(this, globalState.paraState);
      this._explainerStateController = new StateController(this, globalState.paraStates[0]);
    }
  }

  get _paraState(): ParaState {
    return this._globalState.paraState;
  }

  extractStyles(id: string) {
    const stylesheets = this.shadowRoot!.adoptedStyleSheets;
    const out: string[] = [];
    // Replace all :host and :host(...) occurrences, not just at the start of the
    // string. The anchored /^:host/ would miss :host inside @media blocks, and
    // would corrupt :host(.selector) into an invalid #id(.selector) form.
    const rewriteHost = (css: string) =>
      css.replace(/:host(?=\b|\()/g, `#${id}`);
    for (const stylesheet of stylesheets) {
      const rules = stylesheet.cssRules;
      for (let i = 0; i < rules.length; i++) {
        out.push(rewriteHost((rules.item(i) as CSSRule).cssText));
      }
    }
    return out.join('\n');
  }

}