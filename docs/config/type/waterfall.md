# Waterfall Type Configuration

[Back to chart-type configuration](../type.md)

Waterfall chart settings.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `type.waterfall.minYValue` | Minimum Y value override | `"unset"` | number \| 'unset' |
| `type.waterfall.maxYValue` | Maximum Y value override | `"unset"` | number \| 'unset' |
| `type.waterfall.barWidth` | Width of waterfall bars | `10` | number |
| `type.waterfall.colorByDatapoint` | Color each bar individually | `false` | boolean |
| `type.waterfall.isDrawLabels` | Draw value labels on bars | `true` | boolean |
| `type.waterfall.labelPosition` | Position of value labels | `"outside"` | [BarDataLabelPosition](#bardatalabelposition) |
| `type.waterfall.barLabelGap` | Gap between labels and bars | `10` | number |
| `type.waterfall.barGap` | Gap between adjacent bars | `10` | number |
| `type.waterfall.labelFontSize` | Font size for labels | `"10pt"` | string |

## Type Definitions

- <span id="bardatalabelposition"></span>**BarDataLabelPosition**: 'center' \| 'end' \| 'base' \| 'outside'
