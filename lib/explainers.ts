import { Manifest, ChartType } from '@fizz/paramanifest';

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
      summary: `<span data-phrasecode="0">School subjects are shown on the </span><span data-phrasecode="1" data-action="highlightHorizontalAxis()">x-axis. </span><span data-phrasecode="2" data-action="clearHorizontalAxisHighlight">The </span><span data-phrasecode="3">number of students enrolled in each subject is shown on the </span><span data-phrasecode="4" data-action="highlightVerticalAxis()">y-axis.
</span><span data-phrasecode="5" data-action="clearVerticalAxisHighlight">By </span><span data-phrasecode="6">the heights of the columns, we see that core subjects like </span><span data-phrasecode="7" data-action="getSeries('Student enrollment').getPoints(0).highlight()">math, </span><span data-phrasecode="8" data-action="getSeries('Student enrollment').getPoints(1).highlight()">English, </span><span data-phrasecode="9" data-action="getSeries('Student enrollment').getPoints(2).highlight()">science, </span><span data-phrasecode="10">and </span><span data-phrasecode="11" data-action="getSeries('Student enrollment').getPoints(3).highlight()">history </span><span data-phrasecode="12">have more students enrolled than electives like </span><span data-phrasecode="13" data-action="getSeries('Student enrollment').getPoints(4).highlight()">art, </span><span data-phrasecode="14" data-action="getSeries('Student enrollment').getPoints(5).highlight()">music, </span><span data-phrasecode="15">and </span><span data-phrasecode="16" data-action="getSeries('Student enrollment').getPoints(6).highlight()">psychology.</span>`,
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
    }
  },


  line: {
    single: {
      summary: `<span data-phrasecode="0">This chart shows the </span><span data-phrasecode="1" data-action="highlightTitle()">average temperature in January each year in a given city from 2020 to 2026.</span><span data-phrasecode="2" data-action="clearTitleHighlight()"> The </span><span data-phrasecode="3">years are displayed along </span><span data-phrasecode="4" data-action="highlightHorizontalAxis()">the x-axis, </span><span data-phrasecode="5" data-action="clearHorizontalAxisHighlight()">and average temperatures in Fahrenheit are displayed along </span><span data-phrasecode="6" data-action="highlightVerticalAxis()">the y-axis.</span><span data-phrasecode="7" data-action="clearVerticalAxisHighlight()"> We </span><span data-phrasecode="8">see a rebound trend, where </span><span data-phrasecode="9" data-action="getSeries('Temperature in Fahrenheit').getSequence(0,3).highlight()">the values initially increase, </span><span data-phrasecode="10" data-action="getSeries('Temperature in Fahrenheit').getSequence(2,4).highlight()">then fall, </span><span data-phrasecode="11" data-action="getSeries('Temperature in Fahrenheit').getSequence(3,7).highlight()">and then rise </span><span data-phrasecode="12" data-action="getSeries('Temperature in Fahrenheit').getSequence(3,7).clearHighlight()">again.</span>`,
      manifest: {
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
                "theme": {
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
            "data": {
              "source": "inline"
            }
          }
        ]
      }
    },
    multi: {
      summary: `<span data-phrasecode="0">This chart compares the </span><span data-phrasecode="1" data-action="highlightTitle()">revenue in millions for three companies from 2020 to 2026. </span><span data-phrasecode="2" data-action="clearTitleHighlight()">Years are shown </span><span data-phrasecode="3" data-action="highlightHorizontalAxis()">on the x-axis </span><span data-phrasecode="4" data-action="clearHorizontalAxisHighlight()">and </span><span data-phrasecode="5">revenue in millions is shown </span><span data-phrasecode="6" data-action="highlightVerticalAxis()">on the y-axis. </span><span data-phrasecode="7" data-action="clearVerticalAxisHighlight()">We </span><span data-phrasecode="8">see that </span><span data-phrasecode="9" data-action="getSeries('Company A').lowlightOthers()">Company A </span><span data-phrasecode="10" data-action="getSeries('Company A').getSequence(0,3).highlight()">initially rises, </span><span data-phrasecode="11" data-action="getSeries('Company A').getSequence(2,4).highlight()">then falls, </span><span data-phrasecode="12" data-action="getSeries('Company A').getSequence(3,7).highlight()">before rising and stabilizing. </span><span data-phrasecode="13" data-action="getSeries('Company A').getSequence(3,7).clearHighlight()">Meanwhile, </span><span data-phrasecode="14" data-action="getSeries('Company B').lowlightOthers()">Company B stays above Company A and tracks it across the whole chart. </span><span data-phrasecode="15" data-action="getSeries('Company C').lowlightOthers()">Company C </span><span data-phrasecode="16" data-action="getSeries('Company C').getPoint(0).highlight()">starts the lowest, </span><span data-phrasecode="17" data-action="getSeries('Company C').getPoint(0).clearHighlight()">intersects both other lines, </span><span data-phrasecode="18" data-action="getSeries('Company C').getPoint(6).highlight()">and is the highest at </span><span data-phrasecode="19" data-action="getSeries('Company C').getPoint(6).clearHighlight()">the end.</span>`,
      manifest: {
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
                "theme": {
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
                "theme": {
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
                "theme": {
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
            "data": {
              "source": "inline"
            }
          }
        ]
      }
    }
  },


  donut: {
    single: {
      summary: `<span data-phrasecode="0">This chart shows the </span><span data-phrasecode="1" data-action="highlightTitle()">daily time allocation </span><span data-phrasecode="2" data-action="clearTitleHighlight()">of different activities. </span><span data-phrasecode="3">The most amount of time is spent </span><span data-phrasecode="4" data-action="getSeries('Proportion of time').getPoints(1).highlight()">working, at 42%. </span><span data-phrasecode="5" data-action="getSeries('Proportion of time').getPoints(1).clearHighlight()">The least amount of time is spent on </span><span data-phrasecode="6" data-action="getSeries('Proportion of time').getPoints(2).highlight()">leisure activities, at 25%. </span><span data-phrasecode="7" data-action="getSeries('Proportion of time').getPoints(2).clearHighlight()">The time spent on </span><span data-phrasecode="8" data-action="getSeries('Proportion of time').getPoints(0).highlight()">sleep, </span><span data-phrasecode="9" data-action="getSeries('Proportion of time').getPoints(1).highlight()">work, </span><span data-phrasecode="10" data-action="getSeries('Proportion of time').getPoints(1).clearHighlight()">and </span><span data-phrasecode="11" data-action="getSeries('Proportion of time').getPoints(2).highlight()">leisure </span><span data-phrasecode="12" data-action="getSeries('Proportion of time').getPoints(2).clearHighlight()">adds up to 100%.</span>`,
      manifest: {
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
                "theme": {
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
            "data": {
              "source": "inline"
            }
          }
        ]
      }
    }
  },

  pie: {
    single: {
      summary: `<span data-phrasecode="0">This chart shows the </span><span data-phrasecode="1" data-action="highlightTitle()">daily time allocation </span><span data-phrasecode="2" data-action="clearTitleHighlight()">of different activities. </span><span data-phrasecode="3">The most amount of time is spent </span><span data-phrasecode="4" data-action="getSeries('Proportion of time').getPoints(1).highlight()">working, at 42%. </span><span data-phrasecode="5" data-action="getSeries('Proportion of time').getPoints(1).clearHighlight()">The least amount of time is spent on </span><span data-phrasecode="6" data-action="getSeries('Proportion of time').getPoints(2).highlight()">leisure activities, at 25%. </span><span data-phrasecode="7" data-action="getSeries('Proportion of time').getPoints(2).clearHighlight()">The time spent on </span><span data-phrasecode="8" data-action="getSeries('Proportion of time').getPoints(0).highlight()">sleep, </span><span data-phrasecode="9" data-action="getSeries('Proportion of time').getPoints(1).highlight()">work, </span><span data-phrasecode="10" data-action="getSeries('Proportion of time').getPoints(1).clearHighlight()">and </span><span data-phrasecode="11" data-action="getSeries('Proportion of time').getPoints(2).highlight()">leisure </span><span data-phrasecode="12" data-action="getSeries('Proportion of time').getPoints(2).clearHighlight()">adds up to 100%.</span>`,
      manifest: {
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
                "theme": {
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
            "data": {
              "source": "inline"
            }
          }
        ]
      }
    }
  },


  scatter: {
    single: {
      summary: `<span data-phrasecode ="0" data-action="getSeries('Student Scores').getPoints(0).highlight()">Scatter plots are used to show the relationship between two sets of numerical data.</span><span data-phrasecode="1"> Each point represents one pair of values, making it easy to see patterns, trends, or correlations between them.</span><span data-phrasecode="2"> One common method of making scatter plots easier to interpret is by including the best fit line, which shows the overall trend of the data.</span><span data-phrasecode="3"> In this chart, the best fit line indicates that more hours studied corresponds to higher test scores.</span><span data-phrasecode="4"> Some scatter plots also show clusters, where points are grouped densely in specific areas; here we see two clusters: students who studied less and scored lower, and students who studied more and scored higher.</span>`,
      manifest: {
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
                "theme": {
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
            "data": {
              "source": "inline"
            }
          }
        ]
      }
    }
  }
};

export default explainers;
