# Legend Configuration

[Back to configuration](../config.md)

Legend visibility, positioning, and styling.

Settings marked with † are advanced.

| Setting Path | Description | Default | Type |
|---|---|---|---|
| `legend.boxStyle.outline` | Border color | `"none"` | string |
| `legend.boxStyle.outlineWidth` | Border width in pixels | `1` | number |
| `legend.boxStyle.fill` | Background fill color | `"none"` | string |
| `legend.isDrawLegend` | Draw chart legend | `true` | boolean |
| `legend.isAlwaysDrawLegend` | Draw legend | `false` | boolean |
| `legend.padding` | Internal padding within legend box | `10` | number |
| `legend.symbolLabelGap` | Gap between symbol and label | `4` | number |
| `legend.pairGap` | Gap between legend items | `10` | number |
| `legend.position` | Position relative to chart | `"east"` | [CardinalDirection](#cardinaldirection) |
| `legend.margin` | Margin around legend | `20` | number |
| `legend.itemOrder` | Ordering of legend items | `"startingOrder"` | [LegendItemOrder](#legenditemorder) |
| `legend.fontSize` | Font size for legend text | `"10pt"` | string |
| `legend.useDirectLegends` | Position legend items directly | `false` | boolean |

## Type Definitions

- <span id="cardinaldirection"></span>**CardinalDirection**: 'north' \| 'south' \| 'east' \| 'west'
- <span id="legenditemorder"></span>**LegendItemOrder**: 'alphabetical' \| 'reverseAlphabetical' \| 'startingOrder' \| 'endingOrder'
