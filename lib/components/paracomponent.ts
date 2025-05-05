
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

  logName() {
    return this.nodeName;
  }

}