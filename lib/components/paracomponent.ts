
import { type ParaStore } from '../store';

import { LitElement } from 'lit';
import { StateController } from '@lit-app/state';

export class ParaComponent extends LitElement {

  protected _store!: ParaStore;
  protected _storeState!: StateController<ParaStore>;


  get store() {
    return this._store;
  }

  set store(store: ParaStore) {
    this._store = store;
    this._storeState = new StateController(this, store);
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