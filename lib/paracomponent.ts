
import { type ParaController } from './paracontroller';

import { LitElement } from 'lit';

export class ParaComponent extends LitElement {

  protected _controller!: ParaController;

  get controller() {
    return this._controller;
  }

  logName() {
    return this.nodeName;
  }

  set controller(controller: ParaController) {
    this._controller = controller;
  }

}