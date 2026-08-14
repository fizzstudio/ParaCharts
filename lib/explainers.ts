import { ChartType } from '@fizz/chartsignal-internal';
import { type Manifest } from './loader/common';

export type Explainer = {
  summary: string;
  manifest: Manifest;
};

export type ExplainerVariant = 'single' | 'multi';
/*
export type Explainers = {
  [Property in ChartType]: Explainer;
}
*/
type Explainers = {
  [Property in ChartType]?: {
    [Variant in ExplainerVariant]?: Explainer;
  };
};

const explainers: Partial<Explainers> = {
  column: {
    single: {
      summary: `<span data-phrasecode="0">This is a column chart, a way to compare different categories. </span><span data-phrasecode="1" data-action="highlightHorizontalAxis()">At the bottom, on the x-axis, you see the categories being compared. </span><span data-phrasecode="2" data-action="clearHorizontalAxisHighlight()">Each column represents one category. </span><span data-phrasecode="3">The height of each column shows a number or amount, which you can read on the y-axis at the left. </span><span data-phrasecode="4">In this example, the columns show how many students are enrolled in each school subject. </span><span data-phrasecode="5">Taller columns mean more students. </span><span data-phrasecode="6">Shorter columns mean fewer students. </span><span data-phrasecode="7">By comparing the heights of the columns, you can determine which subjects have higher or lower enrollment. </span>`,
      manifest: {
        "jim": {
          "datasets": [
            {
              "title": "Student Enrollment Across Subjects at a Given School",
              "topic": {
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
                  "topic": {
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
              }
            }
          ]
        }
      }
    }
  },

  bar: {
    single: {
      summary: `<span data-phrasecode="0">This is a bar chart, a way to compare different categories. </span><span data-phrasecode="1" data-action="highlightVerticalAxis()">Along the left side, on the x-axis, you see the categories being compared. </span><span data-phrasecode="2" data-action="clearVerticalAxisHighlight()">Each bar represents one category. </span><span data-phrasecode="3" data-action="highlightHorizontalAxis()">The length of each bar shows a number or amount, which you can read on the y-axis at the bottom. </span><span data-phrasecode="4" data-action="clearHorizontalAxisHighlight()">In this example, the bars show how many students are enrolled in each school subject. </span><span data-phrasecode="5" data-action="getSeries('Student enrollment').highlight()">Longer bars mean more students. </span><span data-phrasecode="6" data-action="getSeries('Student enrollment').clearHighlight()">Shorter bars mean fewer students. </span><span data-phrasecode="7">By comparing the lengths of the bars, you can determine which subjects have higher or lower enrollment. </span>`,
      manifest: {
        "jim": {
          "datasets": [
            {
              "title": "Student Enrollment Across Subjects at a Given School",
              "topic": {
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
                  "topic": {
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
                "subtype": "bar"
              },
            }
          ]
        }
      }
    }
  },

  line: {
    single: {
      summary: `<span data-phrasecode="0">A line chart displays how a value changes over time. The horizontal axis typically shows the time period, while the vertical axis shows the measured values. Each point on the line represents a data value at a specific moment, and the connected line helps you see overall patterns—such as upward or downward trends, fluctuations, or periods of stability.</span>`,
      manifest: {
        "jim": {
          "datasets": [
            {
              "title": "Average Temperature in January Each Year in a Given City from 2020 to 2026",
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
                  "topic": {
                    "baseQuantity": "temperature",
                    "baseKind": "number",
                    "locale": "a given city"
                  },
                  "records": [
                    {
                      "x": "2020",
                      "y": "40"
                    },
                    {
                      "x": "2021",
                      "y": "50"
                    },
                    {
                      "x": "2022",
                      "y": "60"
                    },
                    {
                      "x": "2023",
                      "y": "35"
                    },
                    {
                      "x": "2024",
                      "y": "40"
                    },
                    {
                      "x": "2025",
                      "y": "45"
                    },
                    {
                      "x": "2026",
                      "y": "50"
                    }
                  ]
                }
              ],
              "representation": {
                "type": "chart",
                "subtype": "line"
              },
            }
          ]
        }
      }
    },
    multi: {
      summary: `<span data-phrasecode="0">A multi‑line chart shows how several groups or categories change over the same period. The x‑axis typically represents time, while the y‑axis shows the values being measured. Each line corresponds to a different series, making it easy to compare patterns—such as which lines rise or fall, where they move similarly or diverge, and how their values relate at different points in time.</span>`,
      manifest: {
        "jim": {
          "datasets": [
            {
              "title": "Revenue in Millions for Three Companies from 2020 to 2026",
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
                  "label": "Revenue in Millions",
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
                  "key": "Company A",
                  "topic": {
                    "baseQuantity": "revenue",
                    "baseKind": "number",
                    "locale": "Company A"
                  },
                  "records": [
                    { "x": "2020", "y": "30" },
                    { "x": "2021", "y": "40" },
                    { "x": "2022", "y": "50" },
                    { "x": "2023", "y": "25" },
                    { "x": "2024", "y": "30" },
                    { "x": "2025", "y": "35" },
                    { "x": "2026", "y": "37" }
                  ]
                },
                {
                  "key": "Company B",
                  "topic": {
                    "baseQuantity": "revenue",
                    "baseKind": "number",
                    "locale": "Company B"
                  },
                  "records": [
                    { "x": "2020", "y": "52" },
                    { "x": "2021", "y": "58" },
                    { "x": "2022", "y": "68" },
                    { "x": "2023", "y": "47" },
                    { "x": "2024", "y": "51" },
                    { "x": "2025", "y": "57" },
                    { "x": "2026", "y": "59" }
                  ]
                },
                {
                  "key": "Company C",
                  "topic": {
                    "baseQuantity": "revenue",
                    "baseKind": "number",
                    "locale": "Company C"
                  },
                  "records": [
                    { "x": "2020", "y": "22" },
                    { "x": "2021", "y": "27" },
                    { "x": "2022", "y": "35" },
                    { "x": "2023", "y": "40" },
                    { "x": "2024", "y": "50" },
                    { "x": "2025", "y": "57" },
                    { "x": "2026", "y": "66" }
                  ]
                }
              ],
              "representation": {
                "type": "chart",
                "subtype": "line"
              },
            }
          ]
        }
      }
    }
  },

  donut: {
    single: {
      summary: `<span data-phrasecode="0">A donut chart shows how a whole is divided into parts. The entire circle represents 100%, and each slice corresponds to a category’s share of that total. Larger slices indicate larger proportions, allowing you to compare categories and understand how each piece contributes to the overall picture.</span>`,
      manifest: {
        "jim": {
          "datasets": [
            {
              "representation": {
                "type": "chart",
                "subtype": "donut"
              },
              "title": "Daily Time Allocation",
              "facets": {
                "x": {
                  "label": "Activity",
                  "variableType": "independent",
                  "measure": "nominal",
                  "datatype": "string",
                  "displayType": {
                    "type": "marking"
                  }
                },
                "y": {
                  "label": "proportion of time",
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
                  "key": "Proportion of time",
                  "topic": {
                    "baseQuantity": "time",
                    "baseKind": "proportion",
                    "entity": "total time",
                    "aggregate": "total"
                  },
                  "records": [
                    { "x": "Sleep", "y": "33" },
                    { "x": "Work", "y": "42" },
                    { "x": "Leisure", "y": "25" }
                  ]
                }
              ],
            }
          ]
        }
      }
    }
  },

  pie: {
    single: {
      summary: `<span data-phrasecode="0">A pie chart shows how a whole is divided into parts. The entire circle represents 100%, and each slice corresponds to a category’s share of that total. Larger slices indicate larger proportions, allowing you to compare categories and understand how each piece contributes to the overall picture.</span>`,
      manifest: {
        "jim": {
          "datasets": [
            {
              "representation": {
                "type": "chart",
                "subtype": "pie"
              },
              "title": "Daily Time Allocation",
              "facets": {
                "x": {
                  "label": "Activity",
                  "variableType": "independent",
                  "measure": "nominal",
                  "datatype": "string",
                  "displayType": {
                    "type": "marking"
                  }
                },
                "y": {
                  "label": "proportion of time",
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
                  "key": "Proportion of time",
                  "topic": {
                    "baseQuantity": "time",
                    "baseKind": "proportion",
                    "entity": "total time",
                    "aggregate": "total"
                  },
                  "records": [
                    { "x": "Sleep", "y": "33" },
                    { "x": "Work", "y": "42" },
                    { "x": "Leisure", "y": "25" }
                  ]
                }
              ],
            }
          ]
        }
      }
    }
  },

  scatter: {
    single: {
      summary: `<span data-phrasecode="0">A scatter plot shows how two variables relate by placing points on a grid. Each point's position left‑to‑right shows its value on the x‑axis, and its position bottom‑to‑top shows its value on the y‑axis. Reading a point simply means matching its coordinates to the two axes. When many points are shown together, you can spot patterns such as trends, clusters, or outliers, and a best‑fit line can help reveal the overall direction of the relationship.</span>`,
      manifest: {
        "jim": {
          "datasets": [
            {
              "representation": {
                "type": "chart",
                "subtype": "scatter"
              },
              "title": "Hours Studied vs Test Score",
              "facets": {
                "x": {
                  "label": "Hours Studied",
                  "variableType": "independent",
                  "measure": "ratio",
                  "datatype": "number",
                  "units": "hour",
                  "displayType": {
                    "type": "axis",
                    "orientation": "horizontal"
                  }
                },
                "y": {
                  "label": "Test Score",
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
                  "key": "Student Scores",
                  "topic": {
                    "baseQuantity": "score",
                    "baseKind": "number",
                    "entity": "student"
                  },
                  "records": [
                    { "x": "1", "y": "52" },
                    { "x": "1.5", "y": "55" },
                    { "x": "1.75", "y": "51" },
                    { "x": "2", "y": "58" },
                    { "x": "2", "y": "60" },
                    { "x": "2", "y": "42" },
                    { "x": "2.3", "y": "47" },
                    { "x": "2.5", "y": "62" },
                    { "x": "2.66", "y": "56" },
                    { "x": "2.75", "y": "53" },
                    { "x": "3", "y": "65" },
                    { "x": "3", "y": "52" },
                    { "x": "3.5", "y": "68" },
                    { "x": "3.5", "y": "72" },
                    { "x": "3.75", "y": "65" },
                    { "x": "4", "y": "70" },
                    { "x": "4.5", "y": "72" },
                    { "x": "6", "y": "80" },
                    { "x": "6.5", "y": "81" },
                    { "x": "6.5", "y": "73" },
                    { "x": "7", "y": "82" },
                    { "x": "7", "y": "84" },
                    { "x": "7", "y": "92" },
                    { "x": "7.5", "y": "86" },
                    { "x": "8", "y": "88" },
                    { "x": "8.5", "y": "84" },
                    { "x": "8.5", "y": "95" },
                    { "x": "9", "y": "92" },
                    { "x": "9.25", "y": "89" },
                    { "x": "9.5", "y": "94" },
                    { "x": "10", "y": "96" },
                    { "x": "10", "y": "91" }
                  ]
                }
              ],
            }
          ]
        }
      }
    }
  }
};

export default explainers;
