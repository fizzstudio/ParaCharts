# Pie Type Configuration

[Back to chart-type configuration](../type.md)

Pie chart settings.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `type.pie.annularThickness` | *Thickness of donut/gauge ring* † | `1` | number [0, 1] |
| `type.pie.centerLabel` | *What to show in center label* † | `"none"` | 'none' \| 'title' |
| `type.pie.centerLabelPadding` | *Padding around center label* † | `10` | number (>= 0) |
| `type.pie.orientationAngleOffset` | Rotation offset for slice orientation | `90` | number [0, 359] |
| `type.pie.explode` | *Which slices to separate from chart* † | `""` | string |
| `type.pie.explodeDistance` | *Distance for exploded slices* † | `20` | number (>= 0) |
| `type.pie.insideLabels.format` | *Label value format* † | `"raw"` | string |
| `type.pie.insideLabels.position` | *Position as percentage of distance along radius* † | `0.9` | number [0, 1] |
| `type.pie.insideLabels.contents` | Label content template | `"category"` | string |
| `type.pie.outsideLabels.vertGap` | *Vertical gap between labels* † | `10` | number |
| `type.pie.outsideLabels.arcGap` | *Gap between arc and label* † | `10` | number |
| `type.pie.outsideLabels.horizShift` | *Horizontal shift for label positioning* † | `15` | number |
| `type.pie.outsideLabels.horizPadding` | *Horizontal padding around labels* † | `10` | number |
| `type.pie.outsideLabels.leaderStyle` | *Style of leader line to label* † | `"direct"` | 'direct' \| 'underline' |
| `type.pie.outsideLabels.format` | *Label value format* † | `"raw"` | string |
| `type.pie.outsideLabels.underlineGap` | *Gap for underline leader style* † | `2` | number |
| `type.pie.outsideLabels.contents` | *Label content template* † | `"percentage:(value)"` | string |

