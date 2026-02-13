import { Manifest, ChartType } from '@fizz/paramanifest';

export type Explainer = {
  summary: string;
  manifest: Manifest;
};

export type Explainers = {
  [Property in ChartType]: Explainer;
}

const explainers: Partial<Explainers> = {
  column: {
    summary: `<span data-phrasecode="0">Bar charts are used to display categories of data that are not continuous.</span><span data-phrasecode="1"> They are useful when the goal is to compare individual values across categories rather than to emphasize trends over time.</span><span data-phrasecode="2"> This chart shows how many students are enrolled in each subject at a given school, showing that core subjects such as </span><span data-phrasecode="3" data-action="getSeries('Student enrollment').getPoints(0).highlight()">math</span><span data-phrasecode="4">, </span><span data-phrasecode="5" data-action="getSeries('Student enrollment').getPoints(1).highlight()">English</span><span data-phrasecode="6">, </span><span data-phrasecode="7" data-action="getSeries('Student enrollment').getPoints(2).highlight()">science</span><span data-phrasecode="8">, and </span><span data-phrasecode="9" data-action="getSeries('Student enrollment').getPoints(3).highlight()">history</span><span data-phrasecode="10"> have more students than electives such as </span><span data-phrasecode="11" data-action="getSeries('Student enrollment').getPoints(4).highlight()">art</span><span data-phrasecode="12">, </span><span data-phrasecode="13" data-action="getSeries('Student enrollment').getPoints(5).highlight()">music</span><span data-phrasecode="14">, and </span><span data-phrasecode="15" data-action="getSeries('Student enrollment').getPoints(6).highlight()">psychology</span><span data-phrasecode="16">.</span>`,
    manifest: {
      "datasets": [
        {
          "title": "Student Enrollment Across Subjects at a Given School",
          "chartTheme": {
            "baseQuantity": "enrollment",
            "baseKind": "number",
            "locale": "School"
          },
          "facets": {
            "x": {
              "label": "Subject",
              "variableType": "independent",
              "measure": "nominal",
              "datatype": "string",
              "units": "string",
              "displayType": {
                "type": "axis"
              }
            },
            "y": {
              "label": "Number of Students Enrolled",
              "variableType": "dependent",
              "measure": "ratio",
              "datatype": "number",
              "multiplier": 0.01,
              "displayType": {
                "type": "axis"
              }
            }
          },
          "series": [
            {
              "key": "Student enrollment",
              "theme": {
                "baseQuantity": "enrollment",
                "baseKind": "number",
                "locale": "School"
              },
              "records": [
                {
                  "x": "Math",
                  "y": "120"
                },
                {
                  "x": "English",
                  "y": "110"
                },
                {
                  "x": "Science",
                  "y": "105"
                },
                {
                  "x": "History",
                  "y": "95"
                },
                {
                  "x": "Art",
                  "y": "45"
                },
                {
                  "x": "Music",
                  "y": "40"
                },
                {
                  "x": "Psychology",
                  "y": "45"
                }
              ]
            }
          ],
          "representation": {
            "type": "chart",
            "subtype": "column"
          },
          "data": {
            "source": "inline"
          }
        }
      ]
    }
  },
  line: {
    summary: `<span data-phrasecode="0">Line charts are used to show numerical values over a continuous interval or period of time</span><span data-phrasecode="1" data-action="highlightHorizontalAxis()">, with the interval or time scale on the x-axis</span><span data-phrasecode="2" data-action="clearHorizontalAxisHighlight()"> and </span><span data-phrasecode="3" data-action="highlightVerticalAxis()">the values on the y-axis</span><span data-phrasecode="4" data-action="clearVerticalAxisHighlight()">. This</span><span data-phrasecode="5"> makes it easier to observe trends and patterns in the data.</span><span data-phrasecode="6"> In this example of a line chart, we see a rebound trend</span><span data-phrasecode="7" data-action="getSeries('Temperature in Fahrenheit').getPoints(2).highlight()">, where the values initially increase</span><span data-phrasecode="8" data-action="getSeries('Temperature in Fahrenheit').getPoints(3).highlight()">, then fall</span><span data-phrasecode="9" data-action="getSeries('Temperature in Fahrenheit').getPoints(6).highlight()">, and then rise again.</span>`,
    manifest: {
      "datasets": [
        {
          "title": "Average Temperature in January Each Year in a Given City from 2000 to 2006",
          "facets": {
            "x": {
              "label": "Year",
              "variableType": "independent",
              "measure": "interval",
              "datatype": "date",
              "units": "year",
              "displayType": {
                "type": "axis",
                "orientation": "horizontal"
              }
            },
            "y": {
              "label": "Average Temperature in Fahrenheit",
              "variableType": "dependent",
              "measure": "ratio",
              "datatype": "number",
              "displayType": {
                "type": "axis",
                "orientation": "vertical"
              }
            }
          },
          "series": [
            {
              "key": "Temperature in Fahrenheit",
              "theme": {
                "baseQuantity": "temperature",
                "baseKind": "number",
                "locale": "a given city"
              },
              records: [
                {
                  "x": "2000",
                  "y": "40"
                },
                {
                  "x": "2001",
                  "y": "50"
                },
                {
                  "x": "2002",
                  "y": "60"
                },
                {
                  "x": "2003",
                  "y": "35"
                },
                {
                  "x": "2004",
                  "y": "40"
                },
                {
                  "x": "2005",
                  "y": "45"
                },
                {
                  "x": "2006",
                  "y": "50"
                }
              ]
            }
          ],
          "representation": {
            "type": "chart",
            "subtype": "line"
          },
          "data": {
            "source": "inline"
          }
        }
      ]
    }
  },
  pie: {
    summary: `<span data-phrasecode="0">Pie charts are used to show how a whole is divided into parts, with each slice representing a category’s percentage of the total. Because all of the slices together add up to 100 percent, pie charts make it easy to compare proportions at a glance. In this example of the </span><span data-phrasecode="1" data-action="highlightTitle()">annual budget for a given person</span><span data-phrasecode="2" data-action="clearTitleHighlight()">, the chart shows how income is divided among different categories.</span><span data-phrasecode="3" data-action="getSeries('Proportion of total money').getPoints(0).highlight()"> It is immediately clear that rent takes up the largest portion of the budget because its slice is the biggest</span><span data-phrasecode="4" data-action="getSeries('Proportion of total money').getPoints(5).highlight()">, while entertainment represents the smallest share, shown by the smallest slice.</span>`,
    manifest: {
      "datasets": [
        {
          "representation": {
            "type": "chart",
            "subtype": "pie"
          },
          "title": "Annual Budget for a Given Person",
          "facets": {
            "x": {
              "label": "spending category",
              "variableType": "independent",
              "measure": "nominal",
              "datatype": "string",
              "displayType": {
                "type": "marking"
              }
            },
            "y": {
              "label": "Proportion of total money",
              "variableType": "dependent",
              "measure": "ratio",
              "datatype": "number",
              "multiplier": 0.01,
              "displayType": {
                "type": "angle"
              }
            }
          },
          "series": [
            {
              "key": "Proportion of total money",
              "theme": {
                "baseQuantity": "money",
                "baseKind": "proportion",
                "entity": "total money",
                "aggregate": "total"
              },
              "records": [
                { "x": "Rent", "y": "35" },
                { "x": "Transportation", "y": "15" },
                { "x": "Groceries", "y": "15" },
                { "x": "Utilities & Internet", "y": "10" },
                { "x": "Savings", "y": "20" },
                { "x": "Entertainment", "y": "5" },
              ]
            }
          ],
          "data": {
            "source": "inline"
          }
        }
      ]
    }
  }
};

export default explainers;