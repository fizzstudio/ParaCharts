# Manifest Format

Each chart is specified using a JSON manifest.
ParaCharts manifests are extended JIM objects (see [the JIM specification](https://inclusio-community.github.io/json-image-metadata/) for more details).

The `Manifest` type is defined in the [ParaManifest package](https://github.com/fizzstudio/ParaManifest).
A manifest is an object with a property `datasets`, which is an array of `Dataset` objects.
Each `Dataset` object has the following properties

- `type`: the type of the chart (e.g. `line`, `bar`, `stepline`, etc)
- `title`: the title of the chart.
- `subtitle`: the subtitle of the chart.
- `description`: a manually created description of the whole chart.
- `chartTheme`: a `Theme` object specifying the theme of the chart.
- `series`: an array of `SeriesManifest` objects.
- `seriesRelation`: describes how the series are related to one another; can be either `stacked` or `grouped`.
- `data`: the data displayed in the chart.
- `settings`: a `Settings` object specifying the settings of the chart.
