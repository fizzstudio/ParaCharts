# Settings Object

Customize chart appearance, behavior, and accessibility using the hierarchical settings object. Pass settings when creating charts to override defaults.

## Usage Example

```javascript
const chart = new ParaChart({
  data: myData,
  settings: {
    'chart.type': 'line',
    'chart.size.width': 800,
    'ui.isVoicingEnabled': true,
    'color.isDarkModeEnabled': true
  }
});
```

## Settings

### chart

Overall chart appearance and behavior settings.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `chart.type` | The type of chart to display | "bar" | `ChartType` |
| `chart.size.width` | Set width | 600 | `number` |
| `chart.size.height` | Set height | 450 | `number` |
| `chart.title.isDrawTitle` | Enable draw title | true | `boolean` |
| `chart.title.margin` | Set margin | 40 | `number` |
| `chart.title.fontSize` | Size settings | "12pt" | `string` |
| `chart.title.align` | Set align | "center" | `SnapLocation` |
| `chart.title.position` | Set position | "top" | `'top' | 'bottom'` |
| `chart.orientation` | Which direction is "up" on the chart | "north" | `CardinalDirection` |
| `chart.padding` | Padding around chart content (CSS format) | "8 20" | `string` |
| `chart.fontFamily` | Font family for all chart text | "Helvetica, sans-serif" | `string` |
| `chart.fontWeight` | Font weight for chart text | "300" | `string` |
| `chart.fontScale` | Global font size multiplier | 1 | `number` |
| `chart.stroke` | Stroke color for lines and shapes | "purple" | `string` |
| `chart.strokeWidth` | Stroke width in pixels | 4 | `number` |
| `chart.strokeHighlightScale` | Scale factor for highlighted strokes | 1.5 | `number` |
| `chart.symbolStrokeWidth` | Stroke width for symbols in pixels | 2 | `number` |
| `chart.symbolHighlightScale` | Scale factor for highlighted symbols | 1.5 | `number` |
| `chart.hasDirectLabels` | Show direct labels on data points | true | `boolean` |
| `chart.directLabelFontSize` | Font size for direct labels | "10pt" | `string` |
| `chart.hasLegendWithDirectLabels` | Show legend when direct labels are present | false | `boolean` |
| `chart.isDrawSymbols` | Draw symbols at data points | true | `boolean` |
| `chart.isStatic` | Disable all interactivity | false | `boolean` |
| `chart.isShowVisitedDatapointsOnly` | Only show data points that have been visited | false | `boolean` |
| `chart.isShowPopups` | Show popups on hover or focus | false | `boolean` |

### axis

Axis display, labels, ticks, and positioning.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `axis.minInterval` | Set min interval | 25 | `number` |
| `axis.datapointMargin` | Spacing in pixels | 3 | `number` |
| `axis.horiz.isDrawAxis` | Enable draw axis | true | `boolean` |
| `axis.horiz.position` | Set position | "south" | `string` |
| `axis.horiz.title.isDrawTitle` | Enable draw title | false | `boolean` |
| `axis.horiz.title.gap` | Set gap | 8 | `number` |
| `axis.horiz.title.fontSize` | Size settings | "12pt" | `string` |
| `axis.horiz.ticks.isDrawTicks` | Enable draw ticks | true | `boolean` |
| `axis.horiz.ticks.padding` | Set padding | 3 | `number` |
| `axis.horiz.ticks.opacity` | Set opacity | 1 | `number` |
| `axis.horiz.ticks.strokeWidth` | Width or height in pixels | 2 | `number` |
| `axis.horiz.ticks.strokeLinecap` | Set stroke linecap | "round" | `string` |
| `axis.horiz.ticks.length` | Set length | 10 | `number` |
| `axis.horiz.ticks.labelFormat` | Display format (e.g., "raw", "percentage") | "raw" | `LabelFormat` |
| `axis.horiz.ticks.labels.isDrawTickLabels` | Enable draw tick labels | true | `boolean` |
| `axis.horiz.ticks.labels.fontSize` | Size settings | "10pt" | `string` |
| `axis.horiz.ticks.labels.angle` | Set angle | 0 | `number` |
| `axis.horiz.ticks.labels.offsetGap` | Spacing in pixels | 4 | `number` |
| `axis.horiz.ticks.labels.gap` | Set gap | 10 | `number` |
| `axis.horiz.ticks.step` | Set step | 1 | `number` |
| `axis.horiz.ticks.isOnDatapoint` | Only applies to indep axis for non-point charts (e.g., bar charts) | true | `boolean` |
| `axis.horiz.line.isDrawAxisLine` | Enable draw axis line | true | `boolean` |
| `axis.horiz.line.isDrawOverhang` | Enable draw overhang | true | `boolean` |
| `axis.horiz.line.strokeWidth` | Width or height in pixels | 2 | `number` |
| `axis.horiz.line.strokeLinecap` | Set stroke linecap | "round" | `string` |
| `axis.horiz.labelOrder` | Set label order | "westToEast" | `string` |
| `axis.horiz.isStaggerLabels` | Enable stagger labels | false | `boolean` |
| `axis.horiz.isWrapLabels` | Enable wrap labels | true | `boolean` |
| `axis.horiz.interval` | Set interval | "unset" | `string` |
| `axis.vert.isDrawAxis` | Enable draw axis | true | `boolean` |
| `axis.vert.position` | Set position | "west" | `string` |
| `axis.vert.title.isDrawTitle` | Enable draw title | true | `boolean` |
| `axis.vert.title.gap` | Set gap | 8 | `number` |
| `axis.vert.title.fontSize` | Size settings | "12pt" | `string` |
| `axis.vert.ticks.isDrawTicks` | Enable draw ticks | true | `boolean` |
| `axis.vert.ticks.padding` | Set padding | 3 | `number` |
| `axis.vert.ticks.opacity` | Set opacity | 1 | `number` |
| `axis.vert.ticks.strokeWidth` | Width or height in pixels | 2 | `number` |
| `axis.vert.ticks.strokeLinecap` | Set stroke linecap | "round" | `string` |
| `axis.vert.ticks.length` | Set length | 10 | `number` |
| `axis.vert.ticks.labelFormat` | Display format (e.g., "raw", "percentage") | "raw" | `LabelFormat` |
| `axis.vert.ticks.labels.isDrawTickLabels` | Enable draw tick labels | true | `boolean` |
| `axis.vert.ticks.labels.fontSize` | Size settings | "10pt" | `string` |
| `axis.vert.ticks.labels.angle` | Set angle | 0 | `number` |
| `axis.vert.ticks.labels.offsetGap` | Spacing in pixels | 0 | `number` |
| `axis.vert.ticks.labels.gap` | Set gap | 0 | `number` |
| `axis.vert.ticks.step` | Set step | 1 | `number` |
| `axis.vert.ticks.isOnDatapoint` | Only applies to indep axis for non-point charts (e.g., bar charts) | true | `boolean` |
| `axis.vert.line.isDrawAxisLine` | Enable draw axis line | true | `boolean` |
| `axis.vert.line.isDrawOverhang` | Enable draw overhang | true | `boolean` |
| `axis.vert.line.strokeWidth` | Width or height in pixels | 2 | `number` |
| `axis.vert.line.strokeLinecap` | Set stroke linecap | "round" | `string` |
| `axis.vert.labelOrder` | Set label order | "southToNorth" | `string` |
| `axis.vert.isStaggerLabels` | Enable stagger labels | false | `boolean` |
| `axis.vert.isWrapLabels` | Enable wrap labels | false | `boolean` |
| `axis.x.minValue` | Set min value | "unset" | `string` |
| `axis.x.maxValue` | Set max value | "unset" | `string` |
| `axis.x.interval` | Set interval | "unset" | `string` |
| `axis.y.minValue` | Set min value | "unset" | `string` |
| `axis.y.maxValue` | Set max value | "unset" | `string` |
| `axis.y.interval` | Set interval | "unset" | `string` |

### legend

Legend visibility, positioning, and styling.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `legend.isDrawLegend` | Enable draw legend | true | `boolean` |
| `legend.isDrawLegendWhenNeeded` | Enable draw legend when needed | true | `boolean` |
| `legend.isAlwaysDrawLegend` | Enable always draw legend | false | `boolean` |
| `legend.boxStyle.outline` | Set outline | "none" | `string` |
| `legend.boxStyle.outlineWidth` | Width or height in pixels | 1 | `number` |
| `legend.boxStyle.fill` | Set fill | "none" | `string` |
| `legend.padding` | Set padding | 10 | `number` |
| `legend.symbolLabelGap` | Spacing in pixels | 5 | `number` |
| `legend.pairGap` | Spacing in pixels | 30 | `number` |
| `legend.position` | Set position | "east" | `CardinalDirection` |
| `legend.margin` | Set margin | 20 | `number` |
| `legend.itemOrder` | Set item order | "series" | `LegendItemOrder` |
| `legend.fontSize` | Size settings | "10pt" | `string` |

### plotArea

Main chart plotting area dimensions.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `plotArea.size.width` | Set width | 600 | `number` |
| `plotArea.size.height` | Set height | 250 | `number` |

### popup

Tooltip and popup styling.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `popup.opacity` | Set opacity | 1 | `number` |
| `popup.leftPadding` | Spacing in pixels | 10 | `number` |
| `popup.rightPadding` | Spacing in pixels | 10 | `number` |
| `popup.upPadding` | Spacing in pixels | 10 | `number` |
| `popup.downPadding` | Spacing in pixels | 10 | `number` |
| `popup.margin` | Set margin | 40 | `number` |
| `popup.maxWidth` | Width or height in pixels | 175 | `number` |
| `popup.shape` | Set shape | "boxWithArrow" | `"box" | "boxWithArrow"` |
| `popup.activation` | Set activation | "onHover" | `"onHover" | "onFocus" | "onSelect"` |
| `popup.borderRadius` | Set border radius | 10 | `number` |
| `popup.backgroundColor` | Color value or scheme | "dark" | `"dark" | "light"` |

### type

Chart type-specific settings (bar, line, pie, etc.)

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `type.bar.stacking` | Set stacking | "standard" | `string` |
| `type.bar.barWidth` | Width or height in pixels | 20 | `number` |
| `type.bar.colorByDatapoint` | Color value or scheme | false | `string` |
| `type.bar.isDrawTotalLabels` | Enable draw total labels | true | `boolean` |
| `type.bar.stackLabelGap` | Spacing in pixels | 10 | `number` |
| `type.bar.isDrawRecordLabels` | Enable draw record labels | false | `boolean` |
| `type.bar.isDrawDataLabels` | Enable draw data labels | false | `boolean` |
| `type.bar.dataLabelPosition` | Position or placement | "center" | `string` |
| `type.bar.clusterBy` | Set cluster by | *none* | `any` |
| `type.bar.clusterGap` | Spacing in pixels | 0 | `number` |
| `type.bar.isAbbrevSeries` | Enable abbrev series | true | `boolean` |
| `type.bar.orderBy` | Set order by | *none* | `any` |
| `type.bar.barGap` | Spacing in pixels | 2 | `number` |
| `type.bar.stackInsideGap` | Spacing in pixels | 2 | `number` |
| `type.bar.clusterLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | `string` |
| `type.bar.lineWidth` | Width or height in pixels | 5 | `number` |
| `type.bar.isShowPopups` | Enable show popups | false | `boolean` |
| `type.bar.labelFontSize` | Size in pixels | "8pt" | `number` |
| `type.bar.minYValue` | Set min y value | "unset" | `string` |
| `type.bar.maxYValue` | Set max y value | "unset" | `string` |
| `type.column.stacking` | Set stacking | "standard" | `string` |
| `type.column.barWidth` | Width or height in pixels | 10 | `number` |
| `type.column.colorByDatapoint` | Color value or scheme | false | `string` |
| `type.column.isDrawTotalLabels` | Enable draw total labels | false | `boolean` |
| `type.column.isDrawRecordLabels` | Enable draw record labels | false | `boolean` |
| `type.column.isDrawDataLabels` | Enable draw data labels | false | `boolean` |
| `type.column.dataLabelPosition` | Position or placement | "center" | `string` |
| `type.column.stackLabelGap` | Spacing in pixels | 10 | `number` |
| `type.column.clusterBy` | Set cluster by | *none* | `any` |
| `type.column.clusterGap` | Spacing in pixels | 2 | `number` |
| `type.column.isAbbrevSeries` | Enable abbrev series | true | `boolean` |
| `type.column.orderBy` | Set order by | *none* | `any` |
| `type.column.barGap` | Spacing in pixels | 20 | `number` |
| `type.column.stackInsideGap` | Spacing in pixels | 2 | `number` |
| `type.column.clusterLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | `string` |
| `type.column.lineWidth` | Width or height in pixels | 5 | `number` |
| `type.column.isShowPopups` | Enable show popups | false | `boolean` |
| `type.column.labelFontSize` | Size in pixels | "8pt" | `number` |
| `type.column.minYValue` | Set min y value | "unset" | `string` |
| `type.column.maxYValue` | Set max y value | "unset" | `string` |
| `type.line.lineWidth` | Width or height in pixels | 5 | `number` |
| `type.line.lineWidthMax` | Width or height in pixels | 25 | `number` |
| `type.line.lowVisionLineWidth` | Width or height in pixels | 15 | `number` |
| `type.line.lineHighlightScale` | Scaling factor | 1.5 | `number` |
| `type.line.baseSymbolSize` | Size in pixels | 10 | `number` |
| `type.line.seriesLabelPadding` | Spacing in pixels | 5 | `number` |
| `type.line.pointLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | `string` |
| `type.line.leaderLineLength` | Set leader line length | 30 | `number` |
| `type.line.selectedPointMarkerSize.width` | Set width | 20 | `number` |
| `type.line.selectedPointMarkerSize.height` | Set height | 20 | `number` |
| `type.line.isDrawSymbols` | Enable draw symbols | true | `boolean` |
| `type.line.isShowPopups` | Enable show popups | false | `boolean` |
| `type.line.isTrendNavigationModeEnabled` | Enable trend navigation mode enabled | false | `boolean` |
| `type.line.minYValue` | Set min y value | "unset" | `string` |
| `type.line.maxYValue` | Set max y value | "unset" | `string` |
| `type.scatter.isDrawTrendLine` | Enable draw trend line | false | `boolean` |
| `type.scatter.isShowOutliers` | Enable show outliers | false | `boolean` |
| `type.scatter.pointLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | `string` |
| `type.scatter.symbolStrokeWidth` | Width or height in pixels | 2 | `number` |
| `type.scatter.selectedPointMarkerSize.width` | Set width | 20 | `number` |
| `type.scatter.selectedPointMarkerSize.height` | Set height | 20 | `number` |
| `type.scatter.minYValue` | Set min y value | "unset" | `string` |
| `type.scatter.maxYValue` | Set max y value | "unset" | `string` |
| `type.histogram.pointLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | `string` |
| `type.histogram.bins` | Set bins | 20 | `number` |
| `type.histogram.displayAxis` | Set display axis | "x" | `string` |
| `type.histogram.groupingAxis` | Set grouping axis | *none* | `string` |
| `type.histogram.selectedPointMarkerSize.width` | Set width | 20 | `number` |
| `type.histogram.selectedPointMarkerSize.height` | Set height | 20 | `number` |
| `type.histogram.relativeAxes` | Set relative axes | "Counts" | `string` |
| `type.histogram.minYValue` | Set min y value | "unset" | `string` |
| `type.histogram.maxYValue` | Set max y value | "unset" | `string` |
| `type.heatmap.pointLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | `string` |
| `type.heatmap.resolution` | Set resolution | 20 | `number` |
| `type.heatmap.selectedPointMarkerSize.width` | Set width | 20 | `number` |
| `type.heatmap.selectedPointMarkerSize.height` | Set height | 20 | `number` |
| `type.heatmap.minYValue` | Set min y value | "unset" | `string` |
| `type.heatmap.maxYValue` | Set max y value | "unset" | `string` |
| `type.pie.outsideLabels.vertGap` | Spacing in pixels | 10 | `string` |
| `type.pie.outsideLabels.arcGap` | Spacing in pixels | 10 | `string` |
| `type.pie.outsideLabels.horizShift` | Set horiz shift | 15 | `string` |
| `type.pie.outsideLabels.horizPadding` | Spacing in pixels | 10 | `string` |
| `type.pie.outsideLabels.leaderStyle` | Set leader style | "direct" | `string` |
| `type.pie.outsideLabels.format` | Set format | "raw" | `string` |
| `type.pie.outsideLabels.underlineGap` | Spacing in pixels | 2 | `string` |
| `type.pie.outsideLabels.contents` | Set contents | "percentage:(value)" | `string` |
| `type.pie.insideLabels.format` | Set format | "raw" | `string` |
| `type.pie.insideLabels.position` | Set position | 0.9 | `string` |
| `type.pie.insideLabels.contents` | Set contents | "category" | `string` |
| `type.pie.isRenderCenterLabel` | Enable render center label | true | `boolean` |
| `type.pie.annularThickness` | Set annular thickness | 1 | `number` |
| `type.pie.centerLabel` | Label text | "none" | `string` |
| `type.pie.centerLabelPadding` | Spacing in pixels | 10 | `number` |
| `type.pie.orientationAngleOffset` | Angle in degrees | 90 | `number` |
| `type.pie.explode` | Set explode | *none* | `string` |
| `type.pie.explodeDistance` | Set explode distance | 20 | `number` |
| `type.donut.outsideLabels.vertGap` | Spacing in pixels | 10 | `string` |
| `type.donut.outsideLabels.arcGap` | Spacing in pixels | 10 | `string` |
| `type.donut.outsideLabels.horizShift` | Set horiz shift | 15 | `string` |
| `type.donut.outsideLabels.horizPadding` | Spacing in pixels | 10 | `string` |
| `type.donut.outsideLabels.leaderStyle` | Set leader style | "direct" | `string` |
| `type.donut.outsideLabels.format` | Set format | "raw" | `string` |
| `type.donut.outsideLabels.underlineGap` | Spacing in pixels | 2 | `string` |
| `type.donut.outsideLabels.contents` | Set contents | "percentage:(value)" | `string` |
| `type.donut.insideLabels.format` | Set format | "raw" | `string` |
| `type.donut.insideLabels.position` | Set position | 0.85 | `string` |
| `type.donut.insideLabels.contents` | Set contents | "category" | `string` |
| `type.donut.isRenderCenterLabel` | Enable render center label | true | `boolean` |
| `type.donut.annularThickness` | Set annular thickness | 0.5 | `number` |
| `type.donut.centerLabel` | Label text | "title" | `string` |
| `type.donut.centerLabelPadding` | Spacing in pixels | 15 | `number` |
| `type.donut.orientationAngleOffset` | Angle in degrees | 90 | `number` |
| `type.donut.explode` | Set explode | *none* | `string` |
| `type.donut.explodeDistance` | Set explode distance | 20 | `number` |
| `type.gauge.outsideLabels.vertGap` | Spacing in pixels | 4 | `string` |
| `type.gauge.outsideLabels.arcGap` | Spacing in pixels | 10 | `string` |
| `type.gauge.outsideLabels.horizShift` | Set horiz shift | 15 | `string` |
| `type.gauge.outsideLabels.horizPadding` | Spacing in pixels | 10 | `string` |
| `type.gauge.outsideLabels.leaderStyle` | Set leader style | "direct" | `string` |
| `type.gauge.outsideLabels.format` | Set format | "raw" | `string` |
| `type.gauge.outsideLabels.underlineGap` | Spacing in pixels | 6 | `string` |
| `type.gauge.outsideLabels.contents` | Set contents | "percentage:(value)" | `string` |
| `type.gauge.insideLabels.format` | Set format | "raw" | `string` |
| `type.gauge.insideLabels.position` | Set position | 0.85 | `string` |
| `type.gauge.insideLabels.contents` | Set contents | "category" | `string` |
| `type.gauge.isRenderCenterLabel` | Enable render center label | true | `boolean` |
| `type.gauge.annularThickness` | Set annular thickness | 0.5 | `number` |
| `type.gauge.centerLabel` | Label text | "none" | `string` |
| `type.gauge.centerLabelPadding` | Spacing in pixels | 10 | `number` |
| `type.gauge.orientationAngleOffset` | Angle in degrees | 90 | `number` |
| `type.gauge.explode` | Set explode | *none* | `string` |
| `type.gauge.explodeDistance` | Set explode distance | 20 | `number` |
| `type.stepline.lineWidth` | Width or height in pixels | 5 | `number` |
| `type.stepline.lineWidthMax` | Width or height in pixels | 25 | `number` |
| `type.stepline.baseSymbolSize` | Size in pixels | 10 | `number` |
| `type.stepline.seriesLabelPadding` | Spacing in pixels | 5 | `number` |
| `type.stepline.pointLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | `string` |
| `type.stepline.leaderLineLength` | Set leader line length | 30 | `number` |
| `type.stepline.symbolStrokeWidth` | Width or height in pixels | 2 | `number` |
| `type.stepline.selectedPointMarkerSize.width` | Set width | 20 | `number` |
| `type.stepline.selectedPointMarkerSize.height` | Set height | 20 | `number` |
| `type.stepline.minYValue` | Set min y value | "unset" | `string` |
| `type.stepline.maxYValue` | Set max y value | "unset" | `string` |
| `type.lollipop.stacking` | Set stacking | "standard" | `string` |
| `type.lollipop.barWidth` | Width or height in pixels | 10 | `number` |
| `type.lollipop.minBarWidth` | Width or height in pixels | 6 | `number` |
| `type.lollipop.colorByDatapoint` | Color value or scheme | false | `string` |
| `type.lollipop.isDrawTotalLabels` | Enable draw total labels | false | `boolean` |
| `type.lollipop.stackLabelGap` | Spacing in pixels | 10 | `number` |
| `type.lollipop.isDrawRecordLabels` | Enable draw record labels | false | `boolean` |
| `type.lollipop.isDrawDataLabels` | Enable draw data labels | false | `boolean` |
| `type.lollipop.dataLabelPosition` | Position or placement | "end" | `string` |
| `type.lollipop.lineWidth` | Width or height in pixels | 5 | `number` |
| `type.lollipop.clusterBy` | Set cluster by | *none* | `any` |
| `type.lollipop.clusterGap` | Spacing in pixels | 5 | `number` |
| `type.lollipop.isAbbrevSeries` | Enable abbrev series | true | `boolean` |
| `type.lollipop.orderBy` | Set order by | *none* | `any` |
| `type.lollipop.barGap` | Spacing in pixels | 0.25 | `number` |
| `type.lollipop.stackInsideGap` | Spacing in pixels | 4 | `number` |
| `type.lollipop.clusterLabelFormat` | Display format (e.g., "raw", "percentage") | "raw" | `string` |
| `type.lollipop.isShowPopups` | Enable show popups | false | `boolean` |
| `type.lollipop.labelFontSize` | Size in pixels | "8pt" | `number` |
| `type.lollipop.minYValue` | Set min y value | "unset" | `string` |
| `type.lollipop.maxYValue` | Set max y value | "unset" | `string` |
| `type.waterfall.barWidth` | Width or height in pixels | 10 | `number` |
| `type.waterfall.colorByDatapoint` | Color value or scheme | false | `string` |
| `type.waterfall.isDrawLabels` | Enable draw labels | true | `boolean` |
| `type.waterfall.labelPosition` | Position or placement | "outside" | `string` |
| `type.waterfall.barLabelGap` | Spacing in pixels | 10 | `number` |
| `type.waterfall.barGap` | Spacing in pixels | 10 | `number` |
| `type.waterfall.isShowPopups` | Enable show popups | false | `boolean` |
| `type.waterfall.labelFontSize` | Size in pixels | "10pt" | `number` |
| `type.waterfall.minYValue` | Set min y value | "unset" | `string` |
| `type.waterfall.maxYValue` | Set max y value | "unset" | `string` |
| `type.venn.orientationAngleOffset` | Angle in degrees | 0 | `number` |
| `type.venn.insideLabels.contents` | Set contents | *none* | `string` |
| `type.venn.outsideLabels.contents` | Set contents | *none* | `string` |
| `type.venn.explode` | Set explode | *none* | `string` |

### grid

Grid lines and background elements.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `grid.isDrawHorizLines` | Enable draw horiz lines | true | `boolean` |
| `grid.isDrawVertLines` | Enable draw vert lines | true | `boolean` |
| `grid.isDrawHorizAxisOppositeLine` | Enable draw horiz axis opposite line | true | `boolean` |
| `grid.isDrawVertAxisOppositeLine` | Enable draw vert axis opposite line | true | `boolean` |

### ui

User interface and accessibility features.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `ui.isVoicingEnabled` | Enable voice output for screen reader users | false | `boolean` |
| `ui.isNarrativeHighlightEnabled` | Enable visual highlighting when narrative elements are announced | false | `boolean` |
| `ui.isNarrativeHighlightPaused` | Pause narrative highlighting temporarily | false | `boolean` |
| `ui.isAnnouncementEnabled` | Enable aria-live announcements | true | `boolean` |
| `ui.speechRate` | Voice output speech rate. Range: 0.1 to 10 | 1 | `number` |
| `ui.isFullscreenEnabled` | Enable fullscreen mode | false | `boolean` |
| `ui.isLowVisionModeEnabled` | Enable low vision accessibility enhancements | false | `boolean` |
| `ui.isFocusRingEnabled` | Show focus ring around active elements | false | `boolean` |
| `ui.focusRingGap` | Gap size around focus ring in pixels | 10 | `number` |
| `ui.navRunTimeoutMs` | Timeout in milliseconds for navigation runs | 125 | `number` |

### animation

Chart animation timing and effects.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `animation.isAnimationEnabled` | Enable animation enabled | true | `boolean` |
| `animation.animateRevealTimeMs` | Set animate reveal time ms | 2500 | `number` |
| `animation.popInAnimateRevealTimeMs` | Set pop in animate reveal time ms | 750 | `number` |
| `animation.animationType` | Set animation type | "yAxis" | `AnimationType` |
| `animation.animationOrigin` | Set animation origin | "initialValue" | `AnimationOrigin` |
| `animation.animationOriginValue` | Set animation origin value | 0 | `number` |
| `animation.expandPoints` | Enable/disable expand points | true | `boolean` |
| `animation.lineSnake` | Enable/disable line snake | false | `boolean` |
| `animation.symbolPopIn` | Enable/disable symbol pop in | false | `boolean` |

### scrollytelling

Narrative scrolling features.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `scrollytelling.isScrollytellingEnabled` | Enable scrollytelling enabled | true | `boolean` |
| `scrollytelling.isScrollyAnnouncementsEnabled` | Enable scrolly announcements enabled | true | `boolean` |
| `scrollytelling.isScrollySoniEnabled` | Enable scrolly soni enabled | true | `boolean` |

### controlPanel

Control panel visibility and layout.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `controlPanel.isControlPanelDefaultOpen` | Enable control panel default open | true | `boolean` |
| `controlPanel.tabLabelStyle` | Set tab label style | "label" | `TabLabelStyle` |
| `controlPanel.isCaptionVisible` | Enable caption visible | true | `boolean` |
| `controlPanel.isExplorationBarVisible` | Enable exploration bar visible | true | `boolean` |
| `controlPanel.caption.isCaptionExternalWhenControlPanelClosed` | Enable caption external when control panel closed | true | `boolean` |
| `controlPanel.caption.hasBorder` | Enable/disable has border | false | `boolean` |
| `controlPanel.caption.isExplorationBarBeside` | Enable exploration bar beside | true | `boolean` |
| `controlPanel.isSparkBrailleVisible` | Enable spark braille visible | false | `boolean` |
| `controlPanel.isSparkBrailleControlVisible` | Enable spark braille control visible | true | `boolean` |
| `controlPanel.isMDRAnnotationsVisible` | Enable m d r annotations visible | false | `boolean` |
| `controlPanel.isDataTabVisible` | Enable data tab visible | true | `boolean` |
| `controlPanel.isColorsTabVisible` | Enable colors tab visible | true | `boolean` |
| `controlPanel.isAudioTabVisible` | Enable audio tab visible | true | `boolean` |
| `controlPanel.isControlsTabVisible` | Enable controls tab visible | true | `boolean` |
| `controlPanel.isChartTabVisible` | Enable chart tab visible | true | `boolean` |
| `controlPanel.isAnnotationsTabVisible` | Enable annotations tab visible | true | `boolean` |
| `controlPanel.isAnalysisTabVisible` | Enable analysis tab visible | true | `boolean` |
| `controlPanel.isColorPaletteControlVisible` | Enable color palette control visible | true | `boolean` |
| `controlPanel.isCVDControlVisible` | Enable c v d control visible | true | `boolean` |

### color

Color schemes, palettes, and vision accessibility.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `color.colorVisionMode` | Color vision deficiency simulation mode | "normal" | `ColorVisionMode` |
| `color.isDarkModeEnabled` | Enable dark color scheme | false | `boolean` |
| `color.contrastLevel` | Contrast adjustment level (0-2) | 1 | `number` |
| `color.colorPalette` | Name of the color palette to use | "diva" | `string` |

### jim

Navigation assistance features.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `jim.xValueFormat` | Display format (e.g., "raw", "percentage") | "raw" | `LabelFormat` |

### dataTable

Data table formatting.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `dataTable.xValueFormat` | Display format (e.g., "raw", "percentage") | "raw" | `LabelFormat` |
| `dataTable.yValueFormat` | Display format (e.g., "raw", "percentage") | "raw" | `LabelFormat` |

### statusBar

Status bar display options.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `statusBar.valueFormat` | Display format (e.g., "raw", "percentage") | "raw" | `LabelFormat` |

### sonification

Audio feedback and sonification settings.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `sonification.isSoniEnabled` | Enable soni enabled | false | `boolean` |
| `sonification.isRiffEnabled` | Enable riff enabled | true | `boolean` |
| `sonification.isNotificationEnabled` | Enable notification enabled | true | `boolean` |
| `sonification.hertzLower` | Set hertz lower | 35 | `number` |
| `sonification.hertzUpper` | Set hertz upper | 96 | `number` |
| `sonification.soniPlaySpeed` | Rate or speed value | 3 | `number` |
| `sonification.riffSpeed` | Set riff speed | "medium" | `riffSpeeds` |
| `sonification.riffSpeedIndex` | Rate or speed value | 2 | `number` |
| `sonification.isArpeggiateChords` | Enable arpeggiate chords | true | `boolean` |

### dev

Development and debugging options.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `dev.isDebug` | Enable debug | false | `boolean` |
| `dev.isShowGridTerritories` | Enable show grid territories | false | `boolean` |

