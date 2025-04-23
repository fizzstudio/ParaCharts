
import { type ParaStore } from './store/parastore';

import { LitElement } from 'lit';

export class ParaComponent extends LitElement {

  protected _store!: ParaStore;

  get store() {
    return this._store;
  }

  set store(store: ParaStore) {
    this._store = store;
  }

  logName() {
    return this.nodeName;
  }

}