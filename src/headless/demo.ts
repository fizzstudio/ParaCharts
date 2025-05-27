import { ParaHelper } from '../../lib';

window.addEventListener('load', () => new Demo());

class Demo {

  helper: ParaHelper;

  constructor() {
    this.helper = new ParaHelper();
    this.init();
  }

  async init() {
    await this.helper.ready;
    await this.helper.loadManifest('/src/headless/bar-multi-manifest-48.json')!;
    const content = this.helper.serializeChart();
    const container = document.getElementById('content-container');
    container!.innerHTML = content;
  }

}

