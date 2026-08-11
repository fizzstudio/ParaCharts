# Chart Configuration

[Back to configuration](../config.md)

Overall chart appearance and behavior settings.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `chart.type` | The type of chart to display | `"bar"` | [ChartType](#charttype) |
| `chart.width` | Chart width in pixels | `600` | number [1, 1000] |
| `chart.height` | Chart height in pixels | `450` | number [1, 1000] |
| `chart.orientation` | Which direction is 'up' on the chart | `"north"` | [CardinalDirection](#cardinaldirection) |
| `chart.padding` | Padding around chart content (CSS format) | `"8 30"` | string |
| `chart.fontFamily` | Font family for all chart text | `"Atkinson Hyperlegible"` | string |
| `chart.fontWeight` | Font weight for chart text | `"300"` | string |
| `chart.fontScale` | Global font size multiplier | `1` | number [0.5, 3] |
| `chart.isTactileEnabled` | Enable Tactile Mode | `false` | boolean |
| `chart.tactileBrailleGrade` | Braille grade | `1` | 1\|2 |
| `chart.tactileLabelMode` | Include Latin text along with Braille | `"Both"` | [chart.tactileLabelMode values](#chart-tactilelabelmode-values) |
| `chart.pageSize` | Document page size | `"auto"` | [chart.pageSize values](#chart-pagesize-values) |
| `chart.pageMarginLeft` | Page left margin in inches | `0.5` | number (>= 0) |
| `chart.pageMarginRight` | Page right margin in inches | `0.5` | number (>= 0) |
| `chart.pageMarginTop` | Page top margin in inches | `0.5` | number (>= 0) |
| `chart.pageMarginBottom` | Page bottom margin in inches | `0.5` | number (>= 0) |
| `chart.stroke` | Stroke color for lines and shapes | `"purple"` | string |
| `chart.strokeWidth` | Stroke width in pixels | `4` | number |
| `chart.strokeHighlightScale` | Scale factor for highlighted strokes | `1.5` | number |
| `chart.symbolStrokeWidth` | Stroke width for symbols in pixels | `2` | number |
| `chart.symbolHighlightScale` | Scale factor for highlighted symbols | `1.5` | number |
| `chart.hasDirectLabels` | Show direct labels on data points | `true` | boolean |
| `chart.directLabelFontSize` | Font size for direct labels | `"10pt"` | string |
| `chart.hasLegendWithDirectLabels` | Show legend when direct labels are present | `false` | boolean |
| `chart.isDrawSymbols` | Draw symbols at data points | `true` | boolean |
| `chart.isStatic` | Disable all interactivity | `false` | boolean |
| `chart.isShowVisitedDatapointsOnly` | Only show data points that have been visited | `false` | boolean |
| `chart.isShowPopups` | Show popups on hover or focus | `false` | boolean |
| `chart.maxError` | Max allowable error in first pass of segmentation algorithm | `0.01` | number |
| `chart.maxSegments` | Max allowable segments in second pass of segmentation algorithm | `4` | number |
| `chart.extremumWeight` | Additional weight given to "peaks and valleys" during segmentation | `10` | number |
| `chart.subtitle.isDrawSubtitle` | Whether to draw the chart subtitle | `false` | boolean |
| `chart.subtitle.text` | The text of the chart's subtitle. | `""` | string |
| `chart.subtitle.margin` | Space between the chart subtitle and content (in SVG units). | `20` | number |
| `chart.subtitle.fontSize` | The font size of the chart subtitle, as a CSS font size string. | `"11pt"` | string |
| `chart.subtitle.align` | The subtitle alignment | `"center"` | 'start' \| 'end' \| 'center' |
| `chart.title.isDrawTitle` | Whether to draw the chart title | `true` | boolean |
| `chart.title.text` | The text of the chart's title. | `""` | string |
| `chart.title.margin` | Space between the chart title and content (in SVG units). | `20` | number |
| `chart.title.fontSize` | The font size of the chart title, as a CSS font size string. | `"12pt"` | string |
| `chart.title.align` | The title alignment | `"center"` | 'start' \| 'end' \| 'center' |
| `chart.title.position` | The position of the chart title (either 'top' or 'bottom'). | `"top"` | 'top' \| 'bottom' |

## Type Definitions

- <span id="charttype"></span>**ChartType**: 'line' \| 'stepline' \| 'bar' \| 'column' \| 'lollipop' \| 'histogram' \| 'waterfall' \| 'scatter' \| 'heatmap' \| 'pie' \| 'donut' \| 'graph' \| 'venn' \| 'bubble' \| 'candlestick' \| 'combo'
- <span id="cardinaldirection"></span>**CardinalDirection**: 'north' \| 'south' \| 'east' \| 'west'
- <span id="chart-tactilelabelmode-values"></span>**chart.tactileLabelMode values**: 'Braille' \| 'Latin' \| 'Both' \| 'None'
- <span id="chart-pagesize-values"></span>**chart.pageSize values**: 'auto' \| 'letter_portrait' \| 'letter_landscape' \| 'tractor_us_standard' \| 'tractor_us_rotated' \| 'tractor_de_standard' \| 'tractor_de_rotated' \| 'a4_portrait' \| 'a4_landscape' \| 'tabloid_portrait' \| 'tabloid_landscape' \| 'monarch_portrait' \| 'monarch_landscape'
