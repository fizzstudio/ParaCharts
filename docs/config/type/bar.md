# Bar Type Configuration

[Back to chart-type configuration](../type.md)

Horizontal bar chart settings.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `type.bar.minYValue` | Minimum Y value override | `"unset"` | number \| 'unset' |
| `type.bar.maxYValue` | Maximum Y value override | `"unset"` | number \| 'unset' |
| `type.bar.stacking` | How bars are stacked | `"standard"` | 'none' \| 'standard' \| string |
| `type.bar.barWidth` | Width of individual bars | `0` | number |
| `type.bar.colorByDatapoint` | Color each bar individually vs by series | `false` | boolean |
| `type.bar.isDrawTotalLabels` | Show total value labels on stacked bars | `true` | boolean |
| `type.bar.totalLabelGap` | Gap between total value labels and stacks | `5` | number |
| `type.bar.stackLabelGap` | Gap between stack labels and bars | `10` | number |
| `type.bar.isDrawRecordLabels` | Show record name labels | `false` | boolean |
| `type.bar.isDrawDataLabels` | Show data value labels on bars | `false` | boolean |
| `type.bar.dataLabelPosition` | Position of data value labels | `"center"` | [BarDataLabelPosition](#bardatalabelposition) |
| `type.bar.clusterGap` | Gap between bar clusters | `0` | number |
| `type.bar.barGap` | Gap between individual bars | `2` | number |
| `type.bar.stackInsideGap` | Gap inside stacked bars | `2` | number |
| `type.bar.isAbbrevSeries` | Abbreviate series names | `true` | boolean |
| `type.bar.clusterLabelFormat` | Format for cluster labels | `"raw"` | 'raw' \| string |
| `type.bar.lineWidth` | Width of bar outlines | `5` | number |
| `type.bar.labelFontSize` | Font size for bar labels | `"8pt"` | string |

## Type Definitions

- <span id="bardatalabelposition"></span>**BarDataLabelPosition**: 'center' \| 'end' \| 'base' \| 'outside'
