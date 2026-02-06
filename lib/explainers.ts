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
    summary: 'This is a column chart.',
    manifest: {
      "datasets": [
        {
          "type": "column",
          "title": "Unemployment rate in Greece 1999-2019",
          "chartTheme": {
            "baseQuantity": "employment",
            "baseKind": "rate",
            "locale": "Greece"
          },
          "facets": {
            "x": {
              "label": "Year",
              "variableType": "independent",
              "measure": "interval",
              "datatype": "date",
              "units": "year",
              "displayType": {
                "type": "axis"
              }
            },
            "y": {
              "label": "Unemployment rate",
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
              "key": "Unemployment rate",
              "theme": {
                "baseQuantity": "unemployment",
                "baseKind": "rate",
                "locale": "Greece"
              },
              "records": [
                {
                  "x": "1999",
                  "y": "11.85"
                },
                {
                  "x": "2000",
                  "y": "11.25"
                },
                {
                  "x": "2001",
                  "y": "10.46"
                },
                {
                  "x": "2002",
                  "y": "9.98"
                },
                {
                  "x": "2003",
                  "y": "9.41"
                },
                {
                  "x": "2004",
                  "y": "10.31"
                },
                {
                  "x": "2005",
                  "y": "9.99"
                },
                {
                  "x": "2006",
                  "y": "9.01"
                },
                {
                  "x": "2007",
                  "y": "8.4"
                },
                {
                  "x": "2008",
                  "y": "7.76"
                },
                {
                  "x": "2009",
                  "y": "9.62"
                },
                {
                  "x": "2010",
                  "y": "12.71"
                },
                {
                  "x": "2011",
                  "y": "17.86"
                },
                {
                  "x": "2012",
                  "y": "24.44"
                },
                {
                  "x": "2013",
                  "y": "27.47"
                },
                {
                  "x": "2014",
                  "y": "26.49"
                },
                {
                  "x": "2015",
                  "y": "24.9"
                },
                {
                  "x": "2016",
                  "y": "23.54"
                },
                {
                  "x": "2017",
                  "y": "21.49"
                },
                {
                  "x": "2018",
                  "y": "19.21"
                },
                {
                  "x": "2019",
                  "y": "18.08"
                }
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