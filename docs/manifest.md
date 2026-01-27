# Manifest Format

Each chart is specified using a JSON manifest.
ParaCharts manifests are extended JIM objects (see [the JIM specification](https://inclusio-community.github.io/json-image-metadata/) for more details).

The `Manifest` type is defined in the [ParaManifest package](https://github.com/fizzstudio/ParaManifest).

The data, parameters and settings needed to present a chart in ParaCharts. @public

A manifest has the following top-level properties. The table below lists each
property with its type, whether it is required, and a short description.

| Property | JSON path | Type | Required | Description |
|---|---|---|:---:|---|
| `datasets` | `datasets` | `array` (items: `object`) | Yes | The data and parameters needed to present a chart in ParaCharts. |

If a property contains nested object properties, they are shown in a separate
subsection immediately after the parent property.


### `datasets.type` — nested properties

The property at `datasets.type` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
| `type` | `enum(line,stepline,bar,column,lollipop,histogram,waterfall,scatter,heatmap,pie,donut,graph,venn)` | Yes | The type of the chart, such as 'line' or 'column'. |
| `title` | `string` | Yes | The name of something, as a non-empty string. |
| `subtitle` | `string` | No | The name of something, as a non-empty string. |
| `description` | `string` | No | The name of something, as a non-empty string. |
| `chartTheme` | `object` | No | The topic of a series or chart. |
| `facets` | `object` | Yes | Metadata describing each facet of the chart which represents some dimension of the data. |
| `series` | `array` | Yes | Metadata, and possibly inline data, describing the series of the chart. |
| `seriesRelations` | `enum(stacked,grouped)` | No | How series are related to each other in multi-series bar family charts. Defaults to 'stacked'. |
| `data` | `object` | Yes | The source for the data of a dataset. |
| `settings` | `object` | No | The settings needed to present a chart in ParaCharts. |


### `datasets.title` — nested properties

The property at `datasets.title` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
| `type` | `enum(line,stepline,bar,column,lollipop,histogram,waterfall,scatter,heatmap,pie,donut,graph,venn)` | Yes | The type of the chart, such as 'line' or 'column'. |
| `title` | `string` | Yes | The name of something, as a non-empty string. |
| `subtitle` | `string` | No | The name of something, as a non-empty string. |
| `description` | `string` | No | The name of something, as a non-empty string. |
| `chartTheme` | `object` | No | The topic of a series or chart. |
| `facets` | `object` | Yes | Metadata describing each facet of the chart which represents some dimension of the data. |
| `series` | `array` | Yes | Metadata, and possibly inline data, describing the series of the chart. |
| `seriesRelations` | `enum(stacked,grouped)` | No | How series are related to each other in multi-series bar family charts. Defaults to 'stacked'. |
| `data` | `object` | Yes | The source for the data of a dataset. |
| `settings` | `object` | No | The settings needed to present a chart in ParaCharts. |


### `datasets.subtitle` — nested properties

The property at `datasets.subtitle` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
| `type` | `enum(line,stepline,bar,column,lollipop,histogram,waterfall,scatter,heatmap,pie,donut,graph,venn)` | Yes | The type of the chart, such as 'line' or 'column'. |
| `title` | `string` | Yes | The name of something, as a non-empty string. |
| `subtitle` | `string` | No | The name of something, as a non-empty string. |
| `description` | `string` | No | The name of something, as a non-empty string. |
| `chartTheme` | `object` | No | The topic of a series or chart. |
| `facets` | `object` | Yes | Metadata describing each facet of the chart which represents some dimension of the data. |
| `series` | `array` | Yes | Metadata, and possibly inline data, describing the series of the chart. |
| `seriesRelations` | `enum(stacked,grouped)` | No | How series are related to each other in multi-series bar family charts. Defaults to 'stacked'. |
| `data` | `object` | Yes | The source for the data of a dataset. |
| `settings` | `object` | No | The settings needed to present a chart in ParaCharts. |


### `datasets.description` — nested properties

The property at `datasets.description` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
| `type` | `enum(line,stepline,bar,column,lollipop,histogram,waterfall,scatter,heatmap,pie,donut,graph,venn)` | Yes | The type of the chart, such as 'line' or 'column'. |
| `title` | `string` | Yes | The name of something, as a non-empty string. |
| `subtitle` | `string` | No | The name of something, as a non-empty string. |
| `description` | `string` | No | The name of something, as a non-empty string. |
| `chartTheme` | `object` | No | The topic of a series or chart. |
| `facets` | `object` | Yes | Metadata describing each facet of the chart which represents some dimension of the data. |
| `series` | `array` | Yes | Metadata, and possibly inline data, describing the series of the chart. |
| `seriesRelations` | `enum(stacked,grouped)` | No | How series are related to each other in multi-series bar family charts. Defaults to 'stacked'. |
| `data` | `object` | Yes | The source for the data of a dataset. |
| `settings` | `object` | No | The settings needed to present a chart in ParaCharts. |


### `datasets.chartTheme` — nested properties

The property at `datasets.chartTheme` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
| `baseQuantity` | `object` | Yes | Either the name of a single thing, as a non-empty string, or multiple things, as an array of names. |
| `baseKind` | `enum(number,dimensioned,rate,proportion)` | Yes | What kind of base quantity this is: either a number of things (number), a quantity measured by a unit (dimensioned), a rate of change (rate), or a proportion of a whole (proportion). |
| `locale` | `object` | No | Either the name of a single thing, as a non-empty string, or multiple things, as an array of names. |
| `entity` | `object` | No | Either the name of a single thing, as a non-empty string, or multiple things, as an array of names. |
| `items` | `string` | No | The name of something, as a non-empty string. |
| `aggregate` | `object` | No | Either the name of a single thing, as a non-empty string, or multiple things, as an array of names. |


### `datasets.facets` — nested properties

The property at `datasets.facets` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
| `type` | `enum(line,stepline,bar,column,lollipop,histogram,waterfall,scatter,heatmap,pie,donut,graph,venn)` | Yes | The type of the chart, such as 'line' or 'column'. |
| `title` | `string` | Yes | The name of something, as a non-empty string. |
| `subtitle` | `string` | No | The name of something, as a non-empty string. |
| `description` | `string` | No | The name of something, as a non-empty string. |
| `chartTheme` | `object` | No | The topic of a series or chart. |
| `facets` | `object` | Yes | Metadata describing each facet of the chart which represents some dimension of the data. |
| `series` | `array` | Yes | Metadata, and possibly inline data, describing the series of the chart. |
| `seriesRelations` | `enum(stacked,grouped)` | No | How series are related to each other in multi-series bar family charts. Defaults to 'stacked'. |
| `data` | `object` | Yes | The source for the data of a dataset. |
| `settings` | `object` | No | The settings needed to present a chart in ParaCharts. |


### `datasets.series` — nested properties

The property at `datasets.series` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
| `key` | `ref:#/$defs/name` | Yes | The name of a series, as a non-empty string. This is identical to `name`, but specified for semantic reasons |
| `label` | `ref:#/$defs/name` | No | The name of a series, as a non-empty string. This is identical to `name`, but specified for semantic reasons |
| `theme` | `object` | No | The topic of a series or chart. |
| `records` | `array` | No | The datapoints of this series represented inline. |


### `datasets.seriesRelations` — nested properties

The property at `datasets.seriesRelations` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
| `type` | `enum(line,stepline,bar,column,lollipop,histogram,waterfall,scatter,heatmap,pie,donut,graph,venn)` | Yes | The type of the chart, such as 'line' or 'column'. |
| `title` | `string` | Yes | The name of something, as a non-empty string. |
| `subtitle` | `string` | No | The name of something, as a non-empty string. |
| `description` | `string` | No | The name of something, as a non-empty string. |
| `chartTheme` | `object` | No | The topic of a series or chart. |
| `facets` | `object` | Yes | Metadata describing each facet of the chart which represents some dimension of the data. |
| `series` | `array` | Yes | Metadata, and possibly inline data, describing the series of the chart. |
| `seriesRelations` | `enum(stacked,grouped)` | No | How series are related to each other in multi-series bar family charts. Defaults to 'stacked'. |
| `data` | `object` | Yes | The source for the data of a dataset. |
| `settings` | `object` | No | The settings needed to present a chart in ParaCharts. |


### `datasets.data` — nested properties

The property at `datasets.data` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
| `source` | `enum(inline,external)` | Yes | Whether the data is inline or sourced externally. |


### `datasets.settings` — nested properties

The property at `datasets.settings` is an object or array. It contains the following
sub-properties:

| Property | Type | Required | Description |
|---|---|:---:|---|
| `sonification` | `object` | No | Sonification Settings |
| `aspectRatio` | `number` | No | The ratio of the height to the width of the chart on the screen (i.e. x-axis size / y-axis size). Defaults to 1 (i.e. a square chart). |
| `axis` | `object` | No | Settings for each Axis |

