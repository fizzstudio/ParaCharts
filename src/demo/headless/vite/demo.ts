import { ParaHeadless } from '/lib';
import { type Manifest } from '@fizz/paramanifest';

const container = document.getElementById('content-container')!;
const jim = document.getElementById('jim')! as HTMLTextAreaElement;

async function _selectData(event: Event) {
	event.stopPropagation();

	const fileInput = event.target as HTMLInputElement;
	const fileList = fileInput.files;
	const file = fileList?.item(0);

	if (!file) {
		return;
	}

	const ext = file.name.toLocaleLowerCase().match(/^.+(\.\w+)/)?.[1];

	if ('application/json' === file.type) {
		await _loadManifest(JSON.parse(await file.text()));
	} else if ('text/csv' === file.type) {
		await _loadCsv(file, file.name);
	} else {
		throw new Error(`data file type '${file.type}' not supported`);
	}
}

async function _loadManifest(manifest: Manifest) {
	await headless.loadManifest(JSON.stringify(manifest), 'content');
	await headless.jimReady;
	container.innerHTML = headless.api.serializeChart();
	const metadataEl = container.querySelector('metadata');
	if (metadataEl) {
		jim.value = metadataEl.innerHTML;
	}
}

async function _loadCsv(blob: Blob, fileName: string) {
	const url = URL.createObjectURL(blob);
	await headless.loadData(url);
	
	// Parse CSV to get headers
	const csvText = await blob.text();
	const lines = csvText.split('\n');
	const headers = lines[0].split(',').map(h => h.trim());
	
	const xAxisLabel = headers[0] || 'x axis label';
	const yAxisLabel = headers[1] || 'y axis label';
	
	// Get title from input
	const titleInput = document.getElementById('title-input') as HTMLInputElement;
	const title = titleInput?.value || 'chart title';
	
	// Create manifest using the createManifest function
	const manifest = createManifest(title, xAxisLabel, yAxisLabel, url);
	console.log('Generated manifest:', JSON.stringify(manifest, null, 2));
	
	await _loadManifest(manifest);
}

function createManifest(
  title: string,
  xAxisLabel: string,
  yAxisLabel: string,
  path: string
): Manifest {
  return {
  	datasets: [
      {
        type: "line",
	      title,
        facets: {
          x: {
            label: xAxisLabel,
            variableType: "independent",
            measure: "interval",
            datatype: "date",
            displayType: {
              type: "axis",
              orientation: "horizontal"
            }
          },
          "y": {
            label: yAxisLabel,
            variableType: "dependent",
            measure: "ratio",
            datatype: "number",
            displayType: {
              type: "axis",
              orientation: "vertical"
            }
          }
        },
        series: [
          {
            key: yAxisLabel,
            // theme: {
            //   baseQuantity: "cattle",
            //   baseKind: "number",
            //   locale: "the world"
            // }
          }
        ],
        data: {
          source: "external",
          path,
          format: "text/csv"
        }
      }
    ]
  };
}

const headless = new ParaHeadless();
await headless.ready();

const dataSelect = document.getElementById('data-select')!;
dataSelect.addEventListener('change', _selectData);
