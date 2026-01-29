import { ParaHeadless, type Manifest } from '../../../../lib';

const container = document.getElementById('content-container')!;
const jim = document.getElementById('jim')! as HTMLTextAreaElement;

let _dataFile;
let _svgName;
let _manifest;
let _svgText;
let _dataFieldInfo;

async function _selectData(event: Event) {
	event.stopPropagation();

	const fileInput = event.target as HTMLInputElement;
	const fileList = fileInput.files;
	const file = fileList?.item(0);

	if (!file) {
		return;
	}

	_dataFile = file;

	const ext = file.name.toLocaleLowerCase().match(/^.+(\.\w+)/)?.[1];
	_svgName = ext
		? (file.name.slice(0, -ext.length) + '.svg')
		: (file.name + '.svg');

	if ('application/json' === file.type) {
		await _loadManifest(JSON.parse(await file.text()));
	} else if ('text/csv' === file.type) {
		await _loadCsv(file);
	} else {
		throw new Error(`data file type '${file.type}' not supported`);
	}
}

async function _loadManifest(manifest: Manifest) {
	await headless.loadManifest(JSON.stringify(manifest), 'content');
	await headless.jimReady;
	_manifest = manifest;
	_svgText = headless.api.serializeChart();
	container.innerHTML = _svgText;
	const metadataEl = container.querySelector('metadata');
	if (metadataEl) {
		jim.value = metadataEl.innerHTML;
	}
}

async function _loadCsv(blob: Blob) {
	const url = URL.createObjectURL(blob);
	_dataFieldInfo = await headless.loadData(url);
	URL.revokeObjectURL(url);
}

const headless = new ParaHeadless();
await headless.ready();

const dataSelect = document.getElementById('data-select')!;
dataSelect.addEventListener('change', _selectData);
