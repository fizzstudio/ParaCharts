# Chart-Type Defaults

[Back to configuration](../config.md)

Some chart types override settings outside their own `type` group.

| Chart Type | Setting Path | Override |
|---|---|---|
| bar | `chart.orientation` | `"east"` |
| bar | `axis.vert.labelOrder` | `"northToSouth"` |
| bar | `axis.horiz.ticks.isDrawTicks` | `false` |
| bar | `grid.isDrawHorizLines` | `false` |
| bar | `legend.position` | `"south"` |
| bar | `legend.isAlwaysDrawLegend` | `true` |
| column | `axis.horiz.ticks.isDrawTicks` | `true` |
| column | `axis.vert.line.isDrawOverhang` | `true` |
| column | `grid.isDrawVertLines` | `false` |
| column | `legend.isAlwaysDrawLegend` | `true` |
| line | `grid.isDrawVertLines` | `false` |
| waterfall | `grid.isDrawVertLines` | `false` |
| scatter | `legend.isAlwaysDrawLegend` | `true` |
| scatter | `legend.position` | `"north"` |
| bubble | `legend.isAlwaysDrawLegend` | `true` |
| bubble | `legend.position` | `"north"` |
