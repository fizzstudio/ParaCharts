
import { type ParaState } from '../state';

import { LitElement } from 'lit';
import { StateController } from '@lit-app/state';

export class ParaComponent extends LitElement {

  protected _paraState!: ParaState;
  protected _storeState!: StateController<ParaState>;


  get paraState() {
    return this._paraState;
  }

  set paraState(paraState: ParaState) {
    this._paraState = paraState;
    this._storeState = new StateController(this, paraState);
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