# Combo Type Configuration

[Back to chart-type configuration](../type.md)

Combination chart settings.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `type.combo.minYValue` | Minimum Y value override | `"unset"` | number \| 'unset' |
| `type.combo.maxYValue` | Maximum Y value override | `"unset"` | number \| 'unset' |
| `type.combo.stacking` | How bars are stacked | `"standard"` | 'none' \| 'standard' \| string |
| `type.combo.barWidth` | Width of individual bars | `0` | number |
| `type.combo.colorByDatapoint` | Color each bar individually vs by series | `false` | boolean |
| `type.combo.isDrawTotalLabels` | Show total value labels on stacked bars | `false` | boolean |
| `type.combo.totalLabelGap` | Gap between total value labels and stacks | `10` | number |
| `type.combo.stackLabelGap` | Gap between stack labels and bars | `10` | number |
| `type.combo.isDrawRecordLabels` | Show record name labels | `false` | boolean |
| `type.combo.isDrawDataLabels` | Show data value labels on bars | `false` | boolean |
| `type.combo.dataLabelPosition` | Position of data value labels | `"center"` | [BarDataLabelPosition](#bardatalabelposition) |
| `type.combo.clusterGap` | Gap between bar clusters | `5` | number |
| `type.combo.barGap` | Gap between individual bars | `20` | number |
| `type.combo.stackInsideGap` | Gap inside stacked bars | `2` | number |
| `type.combo.isAbbrevSeries` | Abbreviate series names | `true` | boolean |
| `type.combo.clusterLabelFormat` | Format for cluster labels | `"raw"` | 'raw' \| string |
| `type.combo.lineWidth` | Width of bar outlines | `5` | number |
| `type.combo.labelFontSize` | Font size for bar labels | `"8pt"` | string |

## Type Definitions

- <span id="bardatalabelposition"></span>**BarDataLabelPosition**: 'center' \| 'end' \| 'base' \| 'outside'
