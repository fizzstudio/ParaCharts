# Chart Types

This section describes each chart type supported by ParaCharts, grouped by family. For each, you'll find a description, typical use cases, structure, and a placeholder for a screenshot. The second section shows how each chart type is encoded in a manifest, with code snippet examples.


# Chart Type Families

## Bar and Column Charts

Bar charts and column charts are foundational tools for comparing quantities across categories. In a bar chart, the bars are oriented horizontally, making them ideal for categorical data with longer labels or when you want to emphasize category names. Column charts, on the other hand, display bars vertically and are often used for time series or ordinal data, where the progression along the x-axis is meaningful.

Both chart types support multiple data series, stacking, and clustering. The x-axis typically represents categories (for bar charts) or time/ordinal values (for column charts), while the y-axis shows the corresponding values. These charts are highly effective for visualizing discrete comparisons and trends.


<figure>
	<img src="./assets/bar.svg" alt="Bar chart example" width="300" />
	<figcaption>Bar chart: horizontal bars for comparing categories.</figcaption>
</figure>

<figure>
	<img src="./assets/column.svg" alt="Column chart example" width="300" />
	<figcaption>Column chart: vertical bars for time series or ordinal data.</figcaption>
</figure>

---

## Line Charts

Line charts are designed to show trends and changes over time or across ordered categories. Each data point is connected by a line, making it easy to observe patterns, fluctuations, and overall direction in the data. Line charts are especially useful for continuous data and for highlighting the relationship between variables over a sequence.

Multiple series can be displayed on the same chart, allowing for direct comparison of different datasets. The x-axis usually represents time or an ordered sequence, while the y-axis displays the measured values.


<figure>
	<img src="./assets/line.svg" alt="Line chart example" width="300" />
	<figcaption>Line chart: trends and changes over time or ordered categories.</figcaption>
</figure>

---

## Pie and Donut Charts

Pie charts provide a clear visual representation of proportions within a whole. Each slice corresponds to a category, with the size of the slice indicating its share of the total. Donut charts are a variation of pie charts, featuring a central hole that can be used for additional labeling or simply for stylistic purposes.

These charts are best used when you want to emphasize the relative sizes of parts to a whole, rather than precise values. Each segment is sized according to its value, making it easy to compare proportions at a glance.


<figure>
	<img src="./assets/pie.svg" alt="Pie chart example" width="300" />
	<figcaption>Pie chart: proportions of a whole, each slice is a category.</figcaption>
</figure>

---

## Heatmaps

Heatmaps are powerful for visualizing data density, correlations, or distributions across two dimensions. Each cell in the matrix is colored according to its value, allowing users to quickly spot patterns, clusters, or outliers. The x and y axes represent categories or bins, while color intensity encodes the magnitude of the value.

Heatmaps are especially useful for large datasets where individual values are less important than overall trends or concentrations.

---

## Manifest Encoding for Each Chart Type

Each chart type in ParaCharts is defined by a manifest, a JSON object that specifies the type, data series, categories, and optional settings. Below are concise examples for each chart type, along with notes on customization.

### Bar Chart
The bar chart manifest includes a type field set to "bar", an array of series (each with a name and data array), and a categories array. You can customize stacking, bar width, and color palette through additional options.

```jsonc
{
	"type": "bar",
	"series": [
		{ "name": "Apples", "data": [5, 7, 3] },
		{ "name": "Oranges", "data": [2, 6, 4] }
	],
	"categories": ["Q1", "Q2", "Q3"]
}
```

### Column Chart
Column charts are structured similarly to bar charts, but with type set to "column". The categories typically represent time periods or ordered groups.

```jsonc
{
	"type": "column",
	"series": [
		{ "name": "2019", "data": [10, 15, 20] },
		{ "name": "2020", "data": [12, 18, 25] }
	],
	"categories": ["Jan", "Feb", "Mar"]
}
```

### Line Chart
For line charts, the manifest uses type "line". Each series represents a line, and categories define the x-axis labels. Options include line width, symbol display, and area fill.

```jsonc
{
	"type": "line",
	"series": [
		{ "name": "Revenue", "data": [100, 120, 130] }
	],
	"categories": ["Jan", "Feb", "Mar"]
}
```

### Pie Chart
Pie chart manifests specify type "pie". The series array contains a single set of values, and categories label each slice. You can use options like explode and color palette for further customization.

```jsonc
{
	"type": "pie",
	"series": [
		{ "name": "Market Share", "data": [40, 30, 20, 10] }
	],
	"categories": ["A", "B", "C", "D"]
}
```

### Donut Chart
Donut charts are nearly identical to pie charts, but use type "donut". The central hole can be styled or labeled as needed.

```jsonc
{
	"type": "donut",
	"series": [
		{ "name": "Segments", "data": [25, 25, 25, 25] }
	],
	"categories": ["Q1", "Q2", "Q3", "Q4"]
}
```

### Heatmap
The heatmap manifest uses type "heatmap" and includes xCategories and yCategories arrays, along with a two-dimensional data array. Color scale and label options can be set for further control.

```jsonc
{
	"type": "heatmap",
	"xCategories": ["A", "B", "C"],
	"yCategories": ["X", "Y", "Z"],
	"data": [
		[1, 2, 3],
		[4, 5, 6],
		[7, 8, 9]
	]
}
```

For each chart type, you can add or adjust options to suit your data and presentation needs. Refer to the ParaCharts documentation for a full list of available settings and advanced features.
**Options:** innerRadius, color palette

### Heatmap Example

```jsonc
{
	"type": "heatmap",
	"xCategories": ["A", "B", "C"],
	"yCategories": ["X", "Y", "Z"],
	"data": [
		[1, 2, 3],
		[4, 5, 6],
		[7, 8, 9]
	]
}
```
**Options:** color scale, labels

---

For each chart type, see above for required manifest fields and options. Add your data and customize settings as needed for your use case.
