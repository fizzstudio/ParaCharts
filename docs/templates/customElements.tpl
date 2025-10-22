# Custom Elements

ParaCharts is built on top of the Lit web components library, and exports two top-level custom elements: `para-chart` and `para-chart-ai`.

The `para-chart` element has the following properties:
- `headless`: when the headless property is set, the chart is hidden (both visually and with `aria-hidden`).
  This can be useful for using a ParaChart to generate static images and descriptions without rendering the whole chart component.
- `manifest`: a JSON string containing the data to be displayed in the chart along with any configuration options and metadata.
- `manifestType`: must be one of the values `url`, `content`, or `fizz-chart-data`.
  The value `url` indicates that the data in the chart is to be loaded from an external manifest.
  The value `content` indicates that the manifest is to be loaded from the string specified in the `manifest` property.
  The value `fizz-chart-data` is used internally for testing and demos.
- `data`: the URL from which to fetch the manifest (if `manifestType` is set to `url`).
- `config`: an object containing settings for this chart element.
- `type`: defines the kind of chart to be displayed. Below is a table of supported chart types, grouped by family and described briefly:

| Type       | Family        | Description                                      |
|------------|---------------|--------------------------------------------------|
| `line`     | Line Charts   | Displays data as a continuous line over intervals. |
| `stepline` | Line Charts   | Similar to line chart but with step transitions between points. |
| `bar`      | Bar Charts    | Horizontal bars representing categorical data.   |
| `column`   | Bar Charts    | Vertical bars for comparing values across categories. |
| `lollipop` | Bar Charts    | Combines a line and a dot to emphasize data points. |
| `histogram`| Histogram     | Shows frequency distribution of numerical data.  |
| `scatter`  | Scatter Plots | Plots individual data points on a Cartesian plane. |
| `heatmap`  | Scatter Plots | Represents data density or magnitude using color gradients. |
| `pie`      | Pastry Charts | Circular chart divided into slices to show proportions. |
| `donut`    | Pastry Charts | Variant of pie chart with a hollow center.       |
| `graph`    | Graph         | Graphs of mathematical functions. |

- `description`: a description of the chart.
- `isControlPanelOpen`: specifies whether or not the control panel is initially open.
