# Chart-Type Configuration

[Back to configuration](../config.md)

Chart type-specific settings are split by chart type or internally composed chart model.

| Chart Type / Model | Description | Settings |
|---|---|---:|
| [Bar](type/bar.md) | Horizontal bar chart settings. | 18 |
| [Bubble](type/bubble.md) | Shared settings for Cartesian chart types. | 8 |
| [Column](type/column.md) | Vertical column chart settings. | 18 |
| [Combo](type/combo.md) | Combination chart settings. | 18 |
| [Donut](type/donut.md) | Donut chart settings. | 17 |
| [Heatmap](type/heatmap.md) | Heat map settings. | 5 |
| [Histogram](type/histogram.md) | Histogram settings. | 6 |
| [Line](type/line.md) | Line and step-line chart settings. | 10 |
| [Pie](type/pie.md) | Pie chart settings. | 17 |
| [Scatter](type/scatter.md) | Scatter plot settings. | 4 |
| [Venn](type/venn.md) | Venn diagram settings. | 4 |
| [Waterfall](type/waterfall.md) | Waterfall chart settings. | 9 |

## Shared Settings

Some supported chart types reuse another chart type's settings rather than defining a separate group.

| Chart Type | Settings Group |
|---|---|
| `lollipop` | [bar](type/bar.md) |
| `stepline` | [line](type/line.md) |
| `graph` | No dedicated settings group |
