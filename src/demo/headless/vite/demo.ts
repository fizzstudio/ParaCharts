import { 
  ParaHeadless, 
  buildManifestFromCsv, 
  inferDefaultsFromCsvText,
  type ChartTypeInput,
  type CsvDataType,
  type CsvInferredDefaults
} from '../../../../lib';
import { type Manifest } from '@fizz/paramanifest';

const container = document.getElementById('content-container')!;
const jim = document.getElementById('jim')! as HTMLTextAreaElement;

const chartOptionsFieldset = document.getElementById('chart-options') as HTMLFieldSetElement;
const chartTypeInput = document.getElementById('chart-type-input') as HTMLSelectElement;
const titleInput = document.getElementById('title-input') as HTMLInputElement;
const xAxisVariableInput = document.getElementById('x-axis-variable-input') as HTMLInputElement;
const xAxisTypeInput = document.getElementById('x-axis-type-input') as HTMLSelectElement;
const xAxisTitleInput = document.getElementById('x-axis-title-input') as HTMLInputElement;
const yAxisTitleInput = document.getElementById('y-axis-title-input') as HTMLInputElement;
const axisOptionsDiv = document.getElementById('axis-options') as HTMLDivElement;
const generateChartBtn = document.getElementById('generate-chart') as HTMLButtonElement;
const downloadSvgBtn = document.getElementById('download-svg') as HTMLButtonElement;

let currentFile: File | null = null;
let currentCsvText: string | null = null;

async function _selectData(event: Event) {
  event.stopPropagation();

  const fileInput = event.target as HTMLInputElement;
  const fileList = fileInput.files;
  const file = fileList?.item(0);

  if (!file) {
    return;
  }

  if ('application/json' === file.type) {
    await _loadManifest(JSON.parse(await file.text()));
    chartOptionsFieldset.disabled = true;
    downloadSvgBtn.disabled = false;
  } else if ('text/csv' === file.type) {
    await _populateFormFromCsv(file);
  } else {
    throw new Error(`data file type '${file.type}' not supported`);
  }
}

async function _loadManifest(manifest: Manifest) {
  await headless.loadManifest(JSON.stringify(manifest), 'content');
  await headless.jimReady;
  
  console.log('Description:', await headless.api.getDescription());
  console.log('Alt Text:', await headless.api.getAltText());
  console.log('JIM:', headless.api.getJIM());
  
  container.innerHTML = headless.api.serializeChart();
  const metadataEl = container.querySelector('metadata');
  if (metadataEl) {
    jim.value = metadataEl.innerHTML;
  }
}

async function _populateFormFromCsv(file: File) {
  currentFile = file;
  currentCsvText = await file.text();
  const defaults = inferDefaultsFromCsvText(currentCsvText, file.name);
  titleInput.value = defaults.chartTitle;
  xAxisVariableInput.value = defaults.xAxis.title;
  xAxisTitleInput.value = defaults.xAxis.title;
  xAxisTypeInput.value = defaults.xAxis.dataType;
  yAxisTitleInput.value = defaults.yAxis.title;
  
  chartOptionsFieldset.disabled = false;
  downloadSvgBtn.disabled = true;
  
  _updateAxisOptionsVisibility();
}

function _updateAxisOptionsVisibility() {
  const chartType = chartTypeInput.value as ChartTypeInput;
  const isPastryChart = chartType === 'pie' || chartType === 'donut';
  axisOptionsDiv.style.display = isPastryChart ? 'none' : 'block';
}

async function _generateChart() {
  if (!currentCsvText) {
    throw new Error('No CSV file loaded');
  }
  
  const chartType = chartTypeInput.value as ChartTypeInput;
  const isPastryChart = chartType === 'pie' || chartType === 'donut';
  
  const manifest = buildManifestFromCsv({
    csvText: currentCsvText,
    chartType,
    chartTitle: titleInput.value,
    ...(isPastryChart ? {} : {
      xAxis: {
        variableType: xAxisTypeInput.value as CsvDataType,
        title: xAxisTitleInput.value
      },
      yAxis: {
        title: yAxisTitleInput.value
      }
    })
  });
  
  console.log('Generated manifest:', JSON.stringify(manifest, null, 2));
  
  await _loadManifest(manifest);
  downloadSvgBtn.disabled = false;
}

const headless = new ParaHeadless();
await headless.ready();

const dataSelect = document.getElementById('data-select')!;
dataSelect.addEventListener('change', _selectData);

chartTypeInput.addEventListener('change', _updateAxisOptionsVisibility);

generateChartBtn.addEventListener('click', _generateChart);

downloadSvgBtn.addEventListener('click', () => {
  headless.api.downloadSVG();
});
