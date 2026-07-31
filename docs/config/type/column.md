# Column Type Configuration

[Back to chart-type configuration](../type.md)

Vertical column chart settings.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `type.column.minYValue` | Minimum Y value override | `"unset"` | number \| 'unset' |
| `type.column.maxYValue` | Maximum Y value override | `"unset"` | number \| 'unset' |
| `type.column.stacking` | How bars are stacked | `"standard"` | 'none' \| 'standard' \| string |
| `type.column.barWidth` | Width of individual bars | `0` | number |
| `type.column.colorByDatapoint` | Color each bar individually vs by series | `false` | boolean |
| `type.column.isDrawTotalLabels` | Show total value labels on stacked bars | `false` | boolean |
| `type.column.totalLabelGap` | Gap between total value labels and stacks | `10` | number |
| `type.column.stackLabelGap` | Gap between stack labels and bars | `10` | number |
| `type.column.isDrawRecordLabels` | Show record name labels | `false` | boolean |
| `type.column.isDrawDataLabels` | Show data value labels on bars | `false` | boolean |
| `type.column.dataLabelPosition` | Position of data value labels | `"center"` | [BarDataLabelPosition](#bardatalabelposition) |
| `type.column.clusterGap` | Gap between bar clusters | `5` | number |
| `type.column.barGap` | Gap between individual bars | `20` | number |
| `type.column.stackInsideGap` | Gap inside stacked bars | `2` | number |
| `type.column.isAbbrevSeries` | Abbreviate series names | `true` | boolean |
| `type.column.clusterLabelFormat` | Format for cluster labels | `"raw"` | 'raw' \| string |
| `type.column.lineWidth` | Width of bar outlines | `5` | number |
| `type.column.labelFontSize` | Font size for bar labels | `"8pt"` | string |

## Type Definitions

- <span id="bardatalabelposition"></span>**BarDataLabelPosition**: 'center' \| 'end' \| 'base' \| 'outside'
