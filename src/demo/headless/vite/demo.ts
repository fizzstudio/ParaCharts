import { ParaHelper } from '../../../../lib';

import templateLine from '../paracharts-line.json';

import { type Manifest } from '../../../../lib';

window.addEventListener('load', () => new Demo());

class Demo {

  helper: ParaHelper;

  constructor() {
    this.helper = new ParaHelper();
    this.init();
  }

  async init() {
    await this.helper.ready;
		await this.helper.loadData('/src/demo/headless/Inflation_rate_in_EU_and_Euro_area_2024.csv');
    const manifest = this.populateManifest();
    await this.helper.loadManifest(JSON.stringify(manifest), 'content');
    //await this.helper.loadManifest('/src/demo/headless/paracharts-line.json');
    //await this.helper.loadManifest('/src/demo-data/bar-multi-manifest-48.json')!;
    const content = this.helper.serializeChart();
    const container = document.getElementById('content-container');
    container!.innerHTML = content;
  }

	populateManifest() {
		const manifest = structuredClone(templateLine) as Manifest;
		manifest.datasets[0].title = 'Foo Bar';
		manifest.datasets[0].facets.x.label = 'Baz';
		manifest.datasets[0].facets.y.label = 'Quux';
		const indepKey = 'Year';
		manifest.datasets[0].facets.x.datatype = 'date';
		manifest.datasets[0].series = ['EU', 'Euro area'].map((name) => ({
			key: name,
			theme: {
				baseQuantity: name,
				baseKind: 'dimensioned',
				entity: name,
			},
		}));
    return manifest;
	}

}

