# Settings Object

Customize chart appearance, behavior, and accessibility using the hierarchical settings object. Pass settings when creating charts to override defaults.

## Settings

### chart

Overall chart appearance and behavior settings.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `chart.type` | The type of chart to display | "bar" | [ChartType](#charttype) |
| `chart.size.width` | Set width | 600 | integer (≥ 1) |
| `chart.size.height` | Set height | 450 | integer (≥ 1) |
| `chart.title.isDrawTitle` | Whether to draw the chart title | true | boolean |
| `chart.title.margin` | Space between the chart title and content (in SVG units). | 40 | integer (≥ 0) |
| `chart.title.fontSize` | The font size of the chart title, as a CSS font size string. | "12pt" | string |
| `chart.title.align` | Set align | "center" | 'start' \| 'end' \| 'center' |
| `chart.title.position` | The position of the chart title (either 'top' or 'bottom'). | "top" | 'top' \| 'bottom' |
| `chart.orientation` | Which direction is "up" on the chart | "north" | [CardinalDirection](#cardinaldirection) |
| `chart.padding` | Padding around chart content (CSS format) | "8 30" | string |
| `chart.fontFamily` | Font family for all chart text | "Helvetica, sans-serif" | string |
| `chart.fontWeight` | Font weight for chart text | "300" | string |
| `chart.fontScale` | Global font size multiplier | 1 | number (≥ 0.5) |
| `chart.stroke` | Stroke color for lines and shapes | "purple" | string |
| `chart.strokeWidth` | Stroke width in pixels | 4 | number (≥ 0) |
| `chart.strokeHighlightScale` | Scale factor for highlighted strokes | 1.5 | number (≥ 0) |
| `chart.symbolStrokeWidth` | Stroke width for symbols in pixels | 2 | number (≥ 0) |
| `chart.symbolHighlightScale` | Scale factor for highlighted symbols | 1.5 | number (≥ 0) |
| `chart.hasDirectLabels` | Show direct labels on data points | true | boolean |
| `chart.directLabelFontSize` | Font size for direct labels | "10pt" | string |
| `chart.hasLegendWithDirectLabels` | Show legend when direct labels are present | false | boolean |
| `chart.isDrawSymbols` | Draw symbols at data points | true | boolean |
| `chart.isStatic` | Disable all interactivity | false | boolean |
| `chart.isShowVisitedDatapointsOnly` | Only show data points that have been visited | false | boolean |
| `chart.isShowPopups` | Show popups on hover or focus | false | boolean |

**Type Definitions:**

- <span id="charttype"></span>**ChartType**: 'bar' \| 'lollipop' \| 'line' \| 'stepline' \| 'scatter' \| 'pie' \| 'donut' \| 'gauge' \| 'histogram' \| 'heatmap' \| 'waterfall' \| 'venn'
- <span id="cardinaldirection"></span>**CardinalDirection**: 'north' \| 'south' \| 'east' \| 'west'

### axis

Axis display, labels, ticks, and positioning.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `axis.minInterval` | Minimum interval between axis values | 25 | number (≥ 0) |
| `axis.datapointMargin` | Margin around data points | 3 | number (≥ 0) |
| `axis.horiz.isDrawAxis` | Enable/disable draw axis | true | boolean |
| `axis.horiz.position` | Set position | "south" | string |
| `axis.horiz.title.isDrawTitle` | Enable/disable draw title | false | boolean |
| `axis.horiz.title.gap` | Set gap | 8 | integer (≥ 0) |
| `axis.horiz.title.fontSize` | Size settings | "12pt" | string |
| `axis.horiz.ticks.isDrawTicks` | Enable/disable draw ticks | true | boolean |
| `axis.horiz.ticks.padding` | Set padding | 3 | integer (≥ 0) |
| `axis.horiz.ticks.opacity` | Set opacity | 1 | number in [0, 1] |
| `axis.horiz.ticks.strokeWidth` | Width or height in pixels | 2 | number (≥ 0) |
| `axis.horiz.ticks.strokeLinecap` | Set stroke linecap | "round" | string |
| `axis.horiz.ticks.length` | Set length | 10 | integer (≥ 0) |
| `axis.horiz.ticks.labelFormat` | Display format (e.g., "raw", "percentage") | "raw" | string |
| `axis.horiz.ticks.labels.isDrawTickLabels` | Enable/disable draw tick labels | true | boolean |
| `axis.horiz.ticks.labels.fontSize` | Size settings | "10pt" | string |
| `axis.horiz.ticks.labels.angle` | Set angle | 0 | integer in [-180, 180] |
| `axis.horiz.ticks.labels.offsetGap` | Spacing in pixels | 4 | integer (≥ 0) |
| `axis.horiz.ticks.labels.gap` | Set gap | 10 | integer (≥ 0) |
| `axis.horiz.ticks.step` | Set step | 1 | integer (≥ 1) |
| `axis.horiz.ticks.isOnDatapoint` | Enable/disable on datapoint | true | boolean |
| `axis.horiz.line.isDrawAxisLine` | Enable/disable draw axis line | true | boolean |
| `axis.horiz.line.isDrawOverhang` | Enable/disable draw overhang | true | boolean |
| `axis.horiz.line.strokeWidth` | Width or height in pixels | 2 | number (≥ 0) |
| `axis.horiz.line.strokeLinecap` | Set stroke linecap | "round" | string |
| `axis.horiz.labelOrder` | Set label order | "westToEast" | string |
| `axis.horiz.isStaggerLabels` | Enable/disable stagger labels | false | boolean |
| `axis.horiz.isWrapLabels` | Enable/disable wrap labels | true | boolean |
| `axis.horiz.interval` | Set interval | "unset" | string |
| `axis.vert.isDrawAxis` | Enable/disable draw axis | true | boolean |
| `axis.vert.position` | Set position | "west" | string |
| `axis.vert.title.isDrawTitle` | Enable/disable draw title | true | boolean |
| `axis.vert.title.gap` | Set gap | 8 | integer (≥ 0) |
| `axis.vert.title.fontSize` | Size settings | "12pt" | string |
| `axis.vert.ticks.isDrawTicks` | Enable/disable draw ticks | true | boolean |
| `axis.vert.ticks.padding` | Set padding | 3 | integer (≥ 0) |
| `axis.vert.ticks.opacity` | Set opacity | 1 | number in [0, 1] |
| `axis.vert.ticks.strokeWidth` | Width or height in pixels | 2 | number (≥ 0) |
| `axis.vert.ticks.strokeLinecap` | Set stroke linecap | "round" | string |
| `axis.vert.ticks.length` | Set length | 10 | integer (≥ 0) |
| `axis.vert.ticks.labelFormat` | Display format (e.g., "raw", "percentage") | "raw" | string |
| `axis.vert.ticks.labels.isDrawTickLabels` | Enable/disable draw tick labels | true | boolean |
| `axis.vert.ticks.labels.fontSize` | Size settings | "10pt" | string |
| `axis.vert.ticks.labels.angle` | Set angle | 0 | integer in [-180, 180] |
| `axis.vert.ticks.labels.offsetGap` | Spacing in pixels | 0 | integer (≥ 0) |
| `axis.vert.ticks.labels.gap` | Set gap | 0 | integer (≥ 0) |
| `axis.vert.ticks.step` | Set step | 1 | integer (≥ 1) |
| `axis.vert.ticks.isOnDatapoint` | Enable/disable on datapoint | true | boolean |
| `axis.vert.line.isDrawAxisLine` | Enable/disable draw axis line | true | boolean |
| `axis.vert.line.isDrawOverhang` | Enable/disable draw overhang | true | boolean |
| `axis.vert.line.strokeWidth` | Width or height in pixels | 2 | number (≥ 0) |
| `axis.vert.line.strokeLinecap` | Set stroke linecap | "round" | string |
| `axis.vert.labelOrder` | Set label order | "southToNorth" | string |
| `axis.vert.isStaggerLabels` | Enable/disable stagger labels | false | boolean |
| `axis.vert.isWrapLabels` | Enable/disable wrap labels | false | boolean |
| `axis.x.minValue` | Set min value | "unset" | string |
| `axis.x.maxValue` | Set max value | "unset" | string |
| `axis.x.interval` | Set interval | "unset" | string |
| `axis.y.minValue` | Set min value | "unset" | string |
| `axis.y.maxValue` | Set max value | "unset" | string |
| `axis.y.interval` | Set interval | "unset" | string |

### legend

Legend visibility, positioning, and styling.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `legend.isDrawLegend` | Draw chart legend | true | boolean |
| `legend.isDrawLegendWhenNeeded` | Draw legend only when multiple series present | true | boolean |
| `legend.isAlwaysDrawLegend` | Always draw legend regardless of data | false | boolean |
| `legend.boxStyle.outline` | Set outline | "none" | string |
| `legend.boxStyle.outlineWidth` | Width or height in pixels | 1 | integer (≥ 0) |
| `legend.boxStyle.fill` | Set fill | "none" | string |
| `legend.padding` | Internal padding within legend box | 10 | integer (≥ 0) |
| `legend.symbolLabelGap` | Gap between symbol and label | 4 | integer (≥ 0) |
| `legend.pairGap` | Gap between legend items | 10 | integer (≥ 0) |
| `legend.position` | Position relative to chart | "east" | [CardinalDirection](#cardinaldirection) |
| `legend.margin` | Margin around legend | 20 | integer (≥ 0) |
| `legend.itemOrder` | Ordering of legend items | "series" | 'alphabetical' \| 'series' |
| `legend.fontSize` | Font size for legend text | "10pt" | string |

**Type Definitions:**

- <span id="cardinaldirection"></span>**CardinalDirection**: 'north' \| 'south' \| 'east' \| 'west'

### plotArea

Main chart plotting area dimensions.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `plotArea.size.width` | Set width | 600 | integer |
| `plotArea.size.height` | Set height | 250 | integer |

### popup

Tooltip and popup styling.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `popup.opacity` | Background opacity (0-1) | 1 | number in [0, 1] |
| `popup.leftPadding` | Left padding inside popup | 10 | integer (≥ 0) |
| `popup.rightPadding` | Right padding inside popup | 10 | integer (≥ 0) |
| `popup.upPadding` | Top padding inside popup | 10 | integer (≥ 0) |
| `popup.downPadding` | Bottom padding inside popup | 10 | integer (≥ 0) |
| `popup.margin` | Margin around popup | 40 | integer (≥ 0) |
| `popup.maxWidth` | Maximum width before text wraps | 175 | integer (≥ 0) |
| `popup.shape` | Visual style of popup | "boxWithArrow" | "box" \| "boxWithArrow" |
| `popup.activation` | When popup appears | "onHover" | "onHover" \| "onFocus" \| "onSelect" |
| `popup.borderRadius` | Corner radius for rounded popups | 5 | integer (≥ 0) |
| `popup.backgroundColor` | Background color scheme | "dark" | "dark" \| "light" |
| `popup.isShowCrosshair` | Show crosshair | true | boolean |
| `popup.isCrosshairFollowPointer` | Make crosshair follow pointer | false | boolean |

### type

Chart type-specific settings (bar, line, pie, etc.)

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `type.bar.stacking` | How bars are stacked | "standard" | 'none' \| 'standard' |
| `type.bar.barWidth` | Width of individual bars | 0 | number (≥ 0) |
| `type.bar.colorByDatapoint` | Color each bar individually vs by series | false | boolean |
| `type.bar.isDrawTotalLabels` | Show total value labels on stacked bars | true | boolean |
| `type.bar.totalLabelGap` | Gap between total value labels and stacks | 5 | integer (≥ 0) |
| `type.bar.stackLabelGap` | Gap between stack labels and bars | 10 | integer (≥ 0) |
| `type.bar.isDrawRecordLabels` | Show record name labels | false | boolean |
| `type.bar.isDrawDataLabels` | Show data value labels on bars | false | boolean |
| `type.bar.dataLabelPosition` | Position of data value labels | "center" | [BarDataLabelPosition](#bardatalabelposition) |
| `type.bar.clusterBy` | How to cluster related bars | *none* | 'facet' |
| `type.bar.clusterGap` | Gap between bar clusters | 0 | integer (≥ 0) |
| `type.bar.isAbbrevSeries` | Abbreviate series names | true | boolean |
| `type.bar.orderBy` | Field to sort bars by | *none* | string |
| `type.bar.barGap` | Gap between individual bars | 2 | number (≥ 0) |
| `type.bar.stackInsideGap` | Gap inside stacked bars | 2 | integer (≥ 0) |
| `type.bar.clusterLabelFormat` | Format for cluster labels | "raw" | LabelFormat |
| `type.bar.lineWidth` | Width of bar outlines | 5 | number (≥ 0) |
| `type.bar.isShowPopups` | Enable popup tooltips | false | boolean |
| `type.bar.labelFontSize` | Font size for bar labels | "8pt" | string |
| `type.bar.minYValue` | Set min y value | "unset" | string |
| `type.bar.maxYValue` | Set max y value | "unset" | string |
| `type.column.stacking` | How bars are stacked | "standard" | 'none' \| 'standard' |
| `type.column.barWidth` | Width of individual bars | 0 | number (≥ 0) |
| `type.column.colorByDatapoint` | Color each bar individually vs by series | false | boolean |
| `type.column.isDrawTotalLabels` | Show total value labels on stacked bars | false | boolean |
| `type.column.totalLabelGap` | Gap between total value labels and stacks | 10 | integer (≥ 0) |
| `type.column.isDrawRecordLabels` | Show record name labels | false | boolean |
| `type.column.isDrawDataLabels` | Show data value labels on bars | false | boolean |
| `type.column.dataLabelPosition` | Position of data value labels | "center" | [BarDataLabelPosition](#bardatalabelposition) |
| `type.column.stackLabelGap` | Gap between stack labels and bars | 10 | integer (≥ 0) |
| `type.column.clusterBy` | How to cluster related bars | *none* | 'facet' |
| `type.column.clusterGap` | Gap between bar clusters | 2 | integer (≥ 0) |
| `type.column.isAbbrevSeries` | Abbreviate series names | true | boolean |
| `type.column.orderBy` | Field to sort bars by | *none* | string |
| `type.column.barGap` | Gap between individual bars | 20 | number (≥ 0) |
| `type.column.stackInsideGap` | Gap inside stacked bars | 2 | integer (≥ 0) |
| `type.column.clusterLabelFormat` | Format for cluster labels | "raw" | LabelFormat |
| `type.column.lineWidth` | Width of bar outlines | 5 | number (≥ 0) |
| `type.column.isShowPopups` | Enable popup tooltips | false | boolean |
| `type.column.labelFontSize` | Font size for bar labels | "8pt" | string |
| `type.column.minYValue` | Set min y value | "unset" | string |
| `type.column.maxYValue` | Set max y value | "unset" | string |
| `type.line.lineWidth` | Width of line strokes | 5 | number (≥ 1) |
| `type.line.lineWidthMax` | Maximum line width | 25 | number |
| `type.line.lowVisionLineWidth` | Line width in low vision mode | 15 | number |
| `type.line.lineHighlightScale` | Scale factor for highlighted lines | 1.5 | number (≥ 0) |
| `type.line.baseSymbolSize` | Base size for point symbols | 10 | integer |
| `type.line.seriesLabelPadding` | Padding around series labels | 5 | integer (≥ 0) |
| `type.line.pointLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | string |
| `type.line.leaderLineLength` | Length of leader lines to labels | 30 | integer (≥ 0) |
| `type.line.selectedPointMarkerSize.width` | Set width | 20 | number |
| `type.line.selectedPointMarkerSize.height` | Set height | 20 | number |
| `type.line.isDrawSymbols` | Enable/disable draw symbols | true | boolean |
| `type.line.isShowPopups` | Enable popup tooltips | false | boolean |
| `type.line.isTrendNavigationModeEnabled` | Enable trend-following navigation mode | false | boolean |
| `type.line.minYValue` | Set min y value | "unset" | string |
| `type.line.maxYValue` | Set max y value | "unset" | string |
| `type.scatter.isDrawTrendLine` | Draw trend/regression line | false | boolean |
| `type.scatter.isShowOutliers` | Highlight statistical outliers | false | boolean |
| `type.scatter.pointLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | string |
| `type.scatter.symbolStrokeWidth` | Width or height in pixels | 2 | number |
| `type.scatter.selectedPointMarkerSize.width` | Set width | 20 | number |
| `type.scatter.selectedPointMarkerSize.height` | Set height | 20 | number |
| `type.scatter.minYValue` | Set min y value | "unset" | string |
| `type.scatter.maxYValue` | Set max y value | "unset" | string |
| `type.histogram.pointLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | string |
| `type.histogram.bins` | Number of bins for grouping data | 20 | integer (≥ 5) |
| `type.histogram.displayAxis` | Which axis shows the histogram bars | "x" | string |
| `type.histogram.groupingAxis` | Which axis is used for grouping | *none* | string |
| `type.histogram.selectedPointMarkerSize.width` | Set width | 20 | number |
| `type.histogram.selectedPointMarkerSize.height` | Set height | 20 | number |
| `type.histogram.relativeAxes` | Show counts or percentages | "Counts" | "Counts" \| "Percentage" |
| `type.histogram.minYValue` | Set min y value | "unset" | string |
| `type.histogram.maxYValue` | Set max y value | "unset" | string |
| `type.heatmap.pointLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | string |
| `type.heatmap.resolution` | Grid resolution for heat map | 20 | integer |
| `type.heatmap.selectedPointMarkerSize.width` | Set width | 20 | number |
| `type.heatmap.selectedPointMarkerSize.height` | Set height | 20 | number |
| `type.heatmap.minYValue` | Set min y value | "unset" | string |
| `type.heatmap.maxYValue` | Set max y value | "unset" | string |
| `type.pie.outsideLabels.vertGap` | Vertical gap between labels | 10 | integer (≥ 0) |
| `type.pie.outsideLabels.arcGap` | Gap between arc and label | 10 | integer (≥ 0) |
| `type.pie.outsideLabels.horizShift` | Horizontal shift for label positioning | 15 | integer (≥ 0) |
| `type.pie.outsideLabels.horizPadding` | Horizontal padding around labels | 10 | integer (≥ 0) |
| `type.pie.outsideLabels.leaderStyle` | Style of leader line to label | "direct" | 'direct' \| 'underline' |
| `type.pie.outsideLabels.format` | Label value format | "raw" | LabelFormat |
| `type.pie.outsideLabels.underlineGap` | Gap for underline leader style | 2 | integer (≥ 0) |
| `type.pie.outsideLabels.contents` | Label content template | "percentage:(value)" | string |
| `type.pie.insideLabels.format` | Label value format | "raw" | LabelFormat |
| `type.pie.insideLabels.position` | Position as distance along radius (0-1) | 0.9 | number in [0, 1] |
| `type.pie.insideLabels.contents` | Label content template | "category" | string |
| `type.pie.isRenderCenterLabel` | Show label in center of chart | true | boolean |
| `type.pie.annularThickness` | Thickness of donut/gauge ring | 1 | number in (0, 1] |
| `type.pie.centerLabel` | What to show in center label | "none" | 'none' \| 'title' |
| `type.pie.centerLabelPadding` | Padding around center label | 10 | integer (≥ 0) |
| `type.pie.orientationAngleOffset` | Rotation offset for slice orientation | 90 | integer |
| `type.pie.explode` | Which slices to separate from chart | *none* | string |
| `type.pie.explodeDistance` | Distance for exploded slices | 20 | integer (≥ 0) |
| `type.donut.outsideLabels.vertGap` | Vertical gap between labels | 10 | integer (≥ 0) |
| `type.donut.outsideLabels.arcGap` | Gap between arc and label | 10 | integer (≥ 0) |
| `type.donut.outsideLabels.horizShift` | Horizontal shift for label positioning | 15 | integer (≥ 0) |
| `type.donut.outsideLabels.horizPadding` | Horizontal padding around labels | 10 | integer (≥ 0) |
| `type.donut.outsideLabels.leaderStyle` | Style of leader line to label | "direct" | 'direct' \| 'underline' |
| `type.donut.outsideLabels.format` | Label value format | "raw" | LabelFormat |
| `type.donut.outsideLabels.underlineGap` | Gap for underline leader style | 2 | integer (≥ 0) |
| `type.donut.outsideLabels.contents` | Label content template | "percentage:(value)" | string |
| `type.donut.insideLabels.format` | Label value format | "raw" | LabelFormat |
| `type.donut.insideLabels.position` | Position as distance along radius (0-1) | 0.85 | number in [0, 1] |
| `type.donut.insideLabels.contents` | Label content template | "category" | string |
| `type.donut.isRenderCenterLabel` | Show label in center of chart | true | boolean |
| `type.donut.annularThickness` | Thickness of donut/gauge ring | 0.5 | number in (0, 1] |
| `type.donut.centerLabel` | What to show in center label | "title" | 'none' \| 'title' |
| `type.donut.centerLabelPadding` | Padding around center label | 15 | integer (≥ 0) |
| `type.donut.orientationAngleOffset` | Rotation offset for slice orientation | 90 | integer |
| `type.donut.explode` | Which slices to separate from chart | *none* | string |
| `type.donut.explodeDistance` | Distance for exploded slices | 20 | integer (≥ 0) |
| `type.gauge.outsideLabels.vertGap` | Vertical gap between labels | 4 | integer (≥ 0) |
| `type.gauge.outsideLabels.arcGap` | Gap between arc and label | 10 | integer (≥ 0) |
| `type.gauge.outsideLabels.horizShift` | Horizontal shift for label positioning | 15 | integer (≥ 0) |
| `type.gauge.outsideLabels.horizPadding` | Horizontal padding around labels | 10 | integer (≥ 0) |
| `type.gauge.outsideLabels.leaderStyle` | Style of leader line to label | "direct" | 'direct' \| 'underline' |
| `type.gauge.outsideLabels.format` | Label value format | "raw" | LabelFormat |
| `type.gauge.outsideLabels.underlineGap` | Gap for underline leader style | 6 | integer (≥ 0) |
| `type.gauge.outsideLabels.contents` | Label content template | "percentage:(value)" | string |
| `type.gauge.insideLabels.format` | Label value format | "raw" | LabelFormat |
| `type.gauge.insideLabels.position` | Position as distance along radius (0-1) | 0.85 | number in [0, 1] |
| `type.gauge.insideLabels.contents` | Label content template | "category" | string |
| `type.gauge.isRenderCenterLabel` | Show label in center of chart | true | boolean |
| `type.gauge.annularThickness` | Thickness of donut/gauge ring | 0.5 | number in (0, 1] |
| `type.gauge.centerLabel` | What to show in center label | "none" | 'none' \| 'title' |
| `type.gauge.centerLabelPadding` | Padding around center label | 10 | integer (≥ 0) |
| `type.gauge.orientationAngleOffset` | Rotation offset for slice orientation | 90 | integer |
| `type.gauge.explode` | Which slices to separate from chart | *none* | string |
| `type.gauge.explodeDistance` | Distance for exploded slices | 20 | integer (≥ 0) |
| `type.stepline.lineWidth` | Width of step line strokes | 5 | number |
| `type.stepline.lineWidthMax` | Maximum line width | 25 | number |
| `type.stepline.baseSymbolSize` | Base size for symbols | 10 | integer |
| `type.stepline.seriesLabelPadding` | Padding around series labels | 5 | integer (≥ 0) |
| `type.stepline.pointLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | string |
| `type.stepline.leaderLineLength` | Length of leader lines | 30 | integer (≥ 0) |
| `type.stepline.symbolStrokeWidth` | Width or height in pixels | 2 | number |
| `type.stepline.selectedPointMarkerSize.width` | Set width | 20 | number |
| `type.stepline.selectedPointMarkerSize.height` | Set height | 20 | number |
| `type.stepline.minYValue` | Set min y value | "unset" | string |
| `type.stepline.maxYValue` | Set max y value | "unset" | string |
| `type.lollipop.stacking` | Set stacking | "standard" | string |
| `type.lollipop.barWidth` | Width or height in pixels | 10 | number (≥ 0) |
| `type.lollipop.minBarWidth` | Width or height in pixels | 6 | number |
| `type.lollipop.colorByDatapoint` | Color value | false | boolean |
| `type.lollipop.isDrawTotalLabels` | Enable/disable draw total labels | false | boolean |
| `type.lollipop.totalLabelGap` | Spacing in pixels | 10 | integer (≥ 0) |
| `type.lollipop.stackLabelGap` | Spacing in pixels | 10 | integer (≥ 0) |
| `type.lollipop.isDrawRecordLabels` | Enable/disable draw record labels | false | boolean |
| `type.lollipop.isDrawDataLabels` | Enable/disable draw data labels | false | boolean |
| `type.lollipop.dataLabelPosition` | Set data label position | "end" | string |
| `type.lollipop.lineWidth` | Width or height in pixels | 5 | number (≥ 0) |
| `type.lollipop.clusterBy` | Set cluster by | *none* | any |
| `type.lollipop.clusterGap` | Spacing in pixels | 5 | integer (≥ 0) |
| `type.lollipop.isAbbrevSeries` | Enable/disable abbrev series | true | boolean |
| `type.lollipop.orderBy` | Set order by | *none* | any |
| `type.lollipop.barGap` | Spacing in pixels | 0.25 | number (≥ 0) |
| `type.lollipop.stackInsideGap` | Spacing in pixels | 4 | integer (≥ 0) |
| `type.lollipop.clusterLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | string |
| `type.lollipop.isShowPopups` | Enable/disable show popups | false | boolean |
| `type.lollipop.labelFontSize` | Size settings | "8pt" | string |
| `type.lollipop.minYValue` | Set min y value | "unset" | string |
| `type.lollipop.maxYValue` | Set max y value | "unset" | string |
| `type.waterfall.barWidth` | Width of waterfall bars | 10 | integer |
| `type.waterfall.colorByDatapoint` | Color each bar individually | false | boolean |
| `type.waterfall.isDrawLabels` | Draw value labels on bars | true | boolean |
| `type.waterfall.labelPosition` | Position of value labels | "outside" | [BarDataLabelPosition](#bardatalabelposition) |
| `type.waterfall.barLabelGap` | Gap between labels and bars | 10 | integer (≥ 0) |
| `type.waterfall.barGap` | Gap between adjacent bars | 10 | integer (≥ 0) |
| `type.waterfall.isShowPopups` | Enable popup tooltips | false | boolean |
| `type.waterfall.labelFontSize` | Font size for labels | "10pt" | string |
| `type.waterfall.minYValue` | Set min y value | "unset" | string |
| `type.waterfall.maxYValue` | Set max y value | "unset" | string |
| `type.venn.orientationAngleOffset` | Rotation offset for diagram orientation | 0 | integer |
| `type.venn.insideLabels.contents` | Set contents | *none* | string |
| `type.venn.outsideLabels.contents` | Set contents | *none* | string |
| `type.venn.explode` | Which circles to separate/explode | *none* | string |

**Type Definitions:**

- <span id="bardatalabelposition"></span>**BarDataLabelPosition**: 'center' \| 'end' \| 'base' \| 'outside'

### grid

Grid lines and background elements.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `grid.isDrawHorizLines` | Draw horizontal grid lines | true | boolean |
| `grid.isDrawVertLines` | Draw vertical grid lines | true | boolean |
| `grid.isDrawHorizAxisOppositeLine` | Draw line opposite horizontal axis | true | boolean |
| `grid.isDrawVertAxisOppositeLine` | Draw line opposite vertical axis | true | boolean |

### ui

User interface and accessibility features.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `ui.isVoicingEnabled` | Enable voice output for screen reader users | false | boolean |
| `ui.isNarrativeHighlightEnabled` | Enable visual highlighting when narrative elements are announced | false | boolean |
| `ui.isNarrativeHighlightPaused` | Pause narrative highlighting temporarily | false | boolean |
| `ui.isAnnouncementEnabled` | Enable aria-live announcements | true | boolean |
| `ui.speechRate` | Voice output speech rate. Range: 0.5 to 2 | 1 | number (≥ 0.5) |
| `ui.isFullscreenEnabled` | Enable fullscreen mode | false | boolean |
| `ui.isLowVisionModeEnabled` | Enable low vision accessibility enhancements | false | boolean |
| `ui.isFocusRingEnabled` | Show focus ring around active elements | false | boolean |
| `ui.focusRingGap` | Gap size around focus ring in pixels | 10 | integer (≥ 0) |
| `ui.navRunTimeoutMs` | Timeout in milliseconds for navigation runs | 125 | integer (≥ 0) |

### animation

Chart animation timing and effects.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `animation.isAnimationEnabled` | Enable chart animations | false | boolean |
| `animation.animateRevealTimeMs` | Duration for main chart reveal animation in milliseconds | 2500 | integer (≥ 0) |
| `animation.popInAnimateRevealTimeMs` | Duration for symbol pop-in animation in milliseconds | 750 | integer (≥ 0) |
| `animation.animationType` | Which axis to animate along | "yAxis" | 'yAxis' \| 'xAxis' \| 'none' |
| `animation.animationOrigin` | Starting point for animations | "initialValue" | [AnimationOrigin](#animationorigin) |
| `animation.animationOriginValue` | Custom value for animation origin when set to 'custom' | 0 | number |
| `animation.expandPoints` | Animate point expansion on data reveal | true | boolean |
| `animation.lineSnake` | Animate lines drawing like snakes | false | boolean |
| `animation.symbolPopIn` | Animate symbols popping in individually | false | boolean |

**Type Definitions:**

- <span id="animationorigin"></span>**AnimationOrigin**: 'baseline' \| 'top' \| 'initialValue' \| 'custom'

### scrollytelling

Narrative scrolling features.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `scrollytelling.isScrollytellingEnabled` | Enable scrollytelling mode | true | boolean |
| `scrollytelling.isScrollyAnnouncementsEnabled` | Enable audio announcements during scrolling | true | boolean |
| `scrollytelling.isScrollySoniEnabled` | Enable sonification during scrolling | true | boolean |

### controlPanel

Control panel visibility and layout.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `controlPanel.isControlPanelDefaultOpen` | Open control panel by default | true | boolean |
| `controlPanel.tabLabelStyle` | Style for tab labels (icon, text, or both) | "label" | 'icon' \| 'iconLabel' \| 'label' |
| `controlPanel.isCaptionVisible` | Show chart caption | true | boolean |
| `controlPanel.isExplorationBarVisible` | Show exploration status bar | true | boolean |
| `controlPanel.caption.isCaptionExternalWhenControlPanelClosed` | Move caption outside chart when control panel is closed | true | boolean |
| `controlPanel.caption.hasBorder` | Show border around caption box | false | boolean |
| `controlPanel.caption.isExplorationBarBeside` | Place exploration bar beside caption instead of below | true | boolean |
| `controlPanel.isSparkBrailleVisible` | Show spark braille display | false | boolean |
| `controlPanel.isSparkBrailleControlVisible` | Show spark braille control | true | boolean |
| `controlPanel.isMDRAnnotationsVisible` | Show MDR annotations | false | boolean |
| `controlPanel.isDataTabVisible` | Show data table tab | true | boolean |
| `controlPanel.isColorsTabVisible` | Show colors/appearance tab | true | boolean |
| `controlPanel.isAudioTabVisible` | Show audio settings tab | true | boolean |
| `controlPanel.isControlsTabVisible` | Show controls/interaction tab | true | boolean |
| `controlPanel.isChartTabVisible` | Show chart settings tab | true | boolean |
| `controlPanel.isAnnotationsTabVisible` | Show annotations tab | true | boolean |
| `controlPanel.isAnalysisTabVisible` | Show analysis tab | true | boolean |
| `controlPanel.isColorPaletteControlVisible` | Show color palette control | true | boolean |
| `controlPanel.isCVDControlVisible` | Show color vision deficiency control | true | boolean |

### color

Color schemes, palettes, and vision accessibility.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `color.colorVisionMode` | Color vision deficiency simulation mode | "normal" | [ColorVisionMode](#colorvisionmode) |
| `color.isDarkModeEnabled` | Enable dark color scheme | false | boolean |
| `color.contrastLevel` | Contrast adjustment level (0-2) | 1 | number in [0, 1] |
| `color.colorPalette` | Name of the color palette to use | "diva" | string |

**Type Definitions:**

- <span id="colorvisionmode"></span>**ColorVisionMode**: 'normal' \| 'deutan' \| 'protan' \| 'tritan' \| 'grayscale'

### jim

Navigation assistance features.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `jim.xValueFormat` | Format for X-axis values | "raw" | LabelFormat |

### dataTable

Data table formatting.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `dataTable.xValueFormat` | Format for X-axis values in table | "raw" | LabelFormat |
| `dataTable.yValueFormat` | Format for Y-axis values in table | "raw" | LabelFormat |

### statusBar

Status bar display options.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `statusBar.valueFormat` | Format for status bar values | "raw" | LabelFormat |

### sonification

Audio feedback and sonification settings.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `sonification.isSoniEnabled` | Enable sonification audio feedback | false | boolean |
| `sonification.isRiffEnabled` | Enable musical riff playback | true | boolean |
| `sonification.isNotificationEnabled` | Enable audio notifications | true | boolean |
| `sonification.hertzLower` | Lower frequency bound in Hz | 35 | integer (≥ 0) |
| `sonification.hertzUpper` | Upper frequency bound in Hz | 96 | integer (≥ 0) |
| `sonification.soniPlaySpeed` | Sonification playback speed multiplier | 3 | number |
| `sonification.riffSpeed` | Speed for musical riffs | "medium" | riffSpeeds |
| `sonification.riffSpeedIndex` | Numeric index for riff speed | 2 | integer (≥ 0) |
| `sonification.isArpeggiateChords` | Play chords as arpeggios | true | boolean |

### dev

Development and debugging options.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `dev.isDebug` | Enable debug mode with additional logging | false | boolean |
| `dev.isShowGridTerritories` | Show visual grid territories for debugging layout | false | boolean |

