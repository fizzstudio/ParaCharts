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
    summary: '<span data-phrasecode="0">Bar charts are used to display categories of data that are not continuous. They are useful when the goal is to compare individual values across categories rather than to emphasize trends over time. This chart shows how many students are enrolled in each subject at a given school, showing that core subjects have more students than electives.</span>',
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
    summary: '<span data-phrasecode="0">Line charts are used to show numerical values over a continuous interval or period of time, with the interval or time scale on the x-axis and the values on the y-axis. This makes it easier to observe trends and patterns in the data. In this example of a line chart, we see a rebound trend, where the values initially increase, then fall, and then rise again.</span>',
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
  }
};

export default explainers;