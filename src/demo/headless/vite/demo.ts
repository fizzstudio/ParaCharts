import { ParaHeadless } from '../../../../lib';
import { type Manifest } from '@fizz/paramanifest';

const container = document.getElementById('content-container')!;
const jim = document.getElementById('jim')! as HTMLTextAreaElement;

// Form elements
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

// Store the current file for chart generation
let currentFile: File | null = null;

async function _selectData(event: Event) {
	event.stopPropagation();

	const fileInput = event.target as HTMLInputElement;
	const fileList = fileInput.files;
	const file = fileList?.item(0);

	if (!file) {
		return;
	}

	if ('application/json' === file.type) {
		// JSON manifest - load directly
		await _loadManifest(JSON.parse(await file.text()));
		chartOptionsFieldset.disabled = true;
		downloadSvgBtn.disabled = false;
	} else if ('text/csv' === file.type) {
		// CSV - populate form with defaults and let user configure
		await _populateFormFromCsv(file);
	} else {
		throw new Error(`data file type '${file.type}' not supported`);
	}
}

async function _loadManifest(manifest: Manifest) {
	await headless.loadManifest(JSON.stringify(manifest), 'content');
	await headless.jimReady;
	
	// Log the new API metadata methods
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
	// Store file for later chart generation
	currentFile = file;
	
	// Parse CSV to get headers
	const csvText = await file.text();
	const lines = csvText.split('\n');
	const headers = lines[0].split(',').map(h => h.trim());
	
	// First column is the independent variable (x axis)
	const xVariable = headers[0] || 'x';
	// Remaining columns form the series (use for default y-axis label)
	const seriesColumns = headers.slice(1).filter(h => h.length > 0);
	
	// Generate a default title from the filename
	const defaultTitle = file.name.replace(/\.csv$/i, '').replace(/[-_]/g, ' ');
	
	// Populate form fields with defaults
	titleInput.value = defaultTitle;
	xAxisVariableInput.value = xVariable;
	xAxisTitleInput.value = xVariable;
	yAxisTitleInput.value = seriesColumns[0] || 'Value';
	
	// Try to guess the x-axis data type from the first data row
	if (lines.length > 1) {
		const firstDataValue = lines[1].split(',')[0]?.trim();
		if (firstDataValue) {
			xAxisTypeInput.value = _guessDataType(firstDataValue);
		}
	}
	
	// Enable the form
	chartOptionsFieldset.disabled = false;
	downloadSvgBtn.disabled = true;
	
	// Update axis options visibility based on chart type
	_updateAxisOptionsVisibility();
}

function _guessDataType(value: string): 'string' | 'number' | 'date' {
	// Check if it's a number
	if (!isNaN(Number(value)) && value.trim() !== '') {
		return 'number';
	}
	
	// Check if it looks like a date (various common formats)
	const datePatterns = [
		/^\d{4}-\d{2}-\d{2}/, // ISO: 2024-01-15
		/^\d{1,2}\/\d{1,2}\/\d{2,4}/, // US: 1/15/2024 or 01/15/24
		/^\d{1,2}-\d{1,2}-\d{2,4}/, // 15-01-2024
		/^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/, // Jan 15, 2024
	];
	
	for (const pattern of datePatterns) {
		if (pattern.test(value)) {
			return 'date';
		}
	}
	
	return 'string';
}

function _updateAxisOptionsVisibility() {
	const chartType = chartTypeInput.value as ParachartsInput['chartType'];
	const isPastryChart = chartType === 'pie' || chartType === 'donut';
	axisOptionsDiv.style.display = isPastryChart ? 'none' : 'block';
}

async function _generateChart() {
	if (!currentFile) {
		throw new Error('No CSV file loaded');
	}
	
	const url = URL.createObjectURL(currentFile);
	await headless.loadData(url);
	
	const chartType = chartTypeInput.value as ParachartsInput['chartType'];
	const isPastryChart = chartType === 'pie' || chartType === 'donut';
	
	const manifest = await createManifest({
		chartType,
		chartTitle: titleInput.value,
		dataFile: currentFile,
		...(isPastryChart ? {} : {
			xAxis: {
				variable: xAxisVariableInput.value,
				variableType: xAxisTypeInput.value as XAxisVariableType,
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

type XAxisVariableType = 'string' | 'number' | 'date';

/**
 * Input parameters for Paracharts chart generation.
 * These are collected from the user during the chart wizard flow.
 */
export interface ParachartsInput {
  /** The type of chart to generate */
  chartType: 'line' | 'horizontal_bar' | 'vertical_bar' | 'pie' | 'donut';

  /** The uploaded CSV file containing the chart data */
  dataFile: File;

  /** User-provided title for the chart */
  chartTitle: string;

  /**
   * X-axis configuration (only for bar and line charts).
   * Will be undefined for pie/donut charts.
   */
  xAxis?: {
    /** The variable/column name to use for the X-axis */
    variable: string;
    /** The data type of the X-axis variable */
    variableType: XAxisVariableType;
    /** The display label for the X-axis */
    title: string;
  };

  /**
   * Y-axis configuration (only for bar and line charts).
   * Will be undefined for pie/donut charts.
   */
  yAxis?: {
    /** The display label for the Y-axis */
    title: string;
  };
}


async function createManifest(input: ParachartsInput): Promise<Manifest> {
  const { chartType, chartTitle, dataFile, xAxis, yAxis } = input;
  
  // Create blob URL from the file
  const dataPath = URL.createObjectURL(dataFile);
  
  // Parse CSV to get series keys (all columns after the first)
  const csvText = await dataFile.text();
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const seriesKeys = headers.slice(1).filter(h => h.length > 0);

  const isPastryChart = chartType === 'pie' || chartType === 'donut';
  const isHorizontalBar = chartType === 'horizontal_bar';

  // For bar/line charts, axis config is required
  if (!isPastryChart && (!xAxis || !yAxis)) {
    throw new Error(`xAxis and yAxis parameters are required for ${chartType} charts`);
  }

  // Map xAxis.variableType to manifest measure/datatype
  const variableTypeMap = {
    'string': { measure: 'nominal', datatype: 'string' },
    'number': { measure: 'interval', datatype: 'date' },
    'date': { measure: 'interval', datatype: 'date' }
  } as const;

  // Map chartType to manifest type
  const manifestTypeMap = {
    'horizontal_bar': 'bar',
    'vertical_bar': 'column',
    'line': 'line',
    'pie': 'pie',
    'donut': 'donut'
  } as const;

  // Build facets based on chart type
  let facets: Manifest['datasets'][0]['facets'];

  if (isPastryChart) {
    // Pie/donut charts: derive facets from series keys
    facets = {
      x: {
        label: 'Category',
        variableType: 'independent',
        measure: 'nominal',
        datatype: 'string',
        displayType: {
          type: 'marking'
        }
      },
      y: {
        label: 'Value',
        variableType: 'dependent',
        measure: 'ratio',
        datatype: 'number',
        displayType: {
          type: 'angle'
        }
      }
    };
  } else {
    // Bar/line charts: use provided axis config
    const xTypeConfig = variableTypeMap[xAxis!.variableType];
    
    facets = {
      x: {
        label: xAxis!.title,
        variableType: 'independent',
        measure: xTypeConfig.measure,
        datatype: xTypeConfig.datatype,
        displayType: {
          type: 'axis',
          orientation: isHorizontalBar ? 'vertical' : 'horizontal'
        }
      },
      y: {
        label: yAxis!.title,
        variableType: 'dependent',
        measure: 'ratio',
        datatype: 'number',
        displayType: {
          type: 'axis',
          orientation: isHorizontalBar ? 'horizontal' : 'vertical'
        }
      }
    };
  }

  return {
    datasets: [
      {
        type: manifestTypeMap[chartType],
        title: chartTitle,
        facets,
        series: seriesKeys.map(key => ({
          key,
          theme: {
            baseQuantity: key.toLowerCase(),
            baseKind: 'number'
          }
        })),
        data: {
          source: 'external',
          path: dataPath,
          format: 'text/csv'
        }
      }
    ]
  };
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
