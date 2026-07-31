# Donut Type Configuration

[Back to chart-type configuration](../type.md)

Donut chart settings.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `type.donut.annularThickness` | *Thickness of donut/gauge ring* † | `0.5` | number [0, 1] |
| `type.donut.centerLabel` | *What to show in center label* † | `"title"` | 'none' \| 'title' |
| `type.donut.centerLabelPadding` | *Padding around center label* † | `15` | number (>= 0) |
| `type.donut.orientationAngleOffset` | Rotation offset for slice orientation | `90` | number [0, 359] |
| `type.donut.explode` | *Which slices to separate from chart* † | `""` | string |
| `type.donut.explodeDistance` | *Distance for exploded slices* † | `20` | number (>= 0) |
| `type.donut.insideLabels.format` | *Label value format* † | `"raw"` | string |
| `type.donut.insideLabels.position` | *Position as percentage of distance along radius* † | `0.85` | number [0, 1] |
| `type.donut.insideLabels.contents` | Label content template | `"category"` | string |
| `type.donut.outsideLabels.vertGap` | *Vertical gap between labels* † | `10` | number |
| `type.donut.outsideLabels.arcGap` | *Gap between arc and label* † | `10` | number |
| `type.donut.outsideLabels.horizShift` | *Horizontal shift for label positioning* † | `15` | number |
| `type.donut.outsideLabels.horizPadding` | *Horizontal padding around labels* † | `10` | number |
| `type.donut.outsideLabels.leaderStyle` | *Style of leader line to label* † | `"direct"` | 'direct' \| 'underline' |
| `type.donut.outsideLabels.format` | *Label value format* † | `"raw"` | string |
| `type.donut.outsideLabels.underlineGap` | *Gap for underline leader style* † | `2` | number |
| `type.donut.outsideLabels.contents` | *Label content template* † | `"percentage:(value)"` | string |

