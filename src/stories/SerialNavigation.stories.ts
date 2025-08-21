import {Chart, type ChartProps} from './Chart';
import type { Meta, StoryObj } from '@storybook/web-components';

import { html, TemplateResult } from 'lit';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta = {
  title: 'Chart',
  tags: ['autodocs'],
  render: (args) => Chart(args),
  argTypes: {
  }
} satisfies Meta<ChartProps>;

export default meta;
type Story = StoryObj<ChartProps>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const SerialNavigation: Story = {
  args: {
    // filename: "manifests/autogen/line-multi/line-multi-manifest-16.json",
    filename: "/src/stories/demo-data/line-multi-manifest-261a.json",
    forcecharttype: "line",
    description: 'All the lines except China cluster together while China rises above. U.S., Japan, and Germany track each other across the whole chart.',
    config: {
      'axis.x.title.isDrawTitle': false,
      'ui.isVoicingEnabled': true,
      // 'sonification.isSoniEnabled': true,
      'chart.isShowVisitedDatapointsOnly': true, 
      'chart.hasDirectLabels': false,
      'legend.isDrawLegend': false,
      'grid.isDrawHorizLines': false,
      'grid.isDrawVertLines': false,
    },
    
    // slot: unsafeHTML(`
    //       <table>
    //         <caption>Cars sales in select countries, 2005 to 2018</caption>
    //         <thead>
    //           <tr>
    //             <td>Year</td>
    //             <td>China</td>
    //             <td>U.S.</td>
    //             <td>Japan</td>
    //             <td>Germany</td>
    //           </tr>
    //         </thead>
    //         <tbody>
    //           <tr>
    //             <td>2005</td>
    //             <td>3.97</td>
    //             <td>7.66</td>
    //             <td>4.75</td>
    //             <td>3.32</td>
    //           </tr>
    //           <tr>
    //             <td>2006</td>
    //             <td>5.18</td>
    //             <td>7.76</td>
    //             <td>4.61</td>
    //             <td>3.47</td>
    //           </tr>
    //           <tr>
    //             <td>2007</td>
    //             <td>6.3</td>
    //             <td>7.56</td>
    //             <td>4.33</td>
    //             <td>3.15</td>
    //           </tr>
    //           <tr>
    //             <td>2008</td>
    //             <td>6.76</td>
    //             <td>6.77</td>
    //             <td>4.18</td>
    //             <td>3.09</td>
    //           </tr>
    //           <tr>
    //             <td>2009</td>
    //             <td>10.33</td>
    //             <td>5.4</td>
    //             <td>3.91</td>
    //             <td>3.81</td>
    //           </tr>
    //           <tr>
    //             <td>2010</td>
    //             <td>13.76</td>
    //             <td>5.64</td>
    //             <td>4.2</td>
    //             <td>2.92</td>
    //           </tr>
    //           <tr>
    //             <td>2011</td>
    //             <td>14.47</td>
    //             <td>6.09</td>
    //             <td>3.51</td>
    //             <td>3.17</td>
    //           </tr>
    //           <tr>
    //             <td>2012</td>
    //             <td>15.5</td>
    //             <td>7.24</td>
    //             <td>4.57</td>
    //             <td>3.08</td>
    //           </tr>
    //           <tr>
    //             <td>2013</td>
    //             <td>17.93</td>
    //             <td>7.59</td>
    //             <td>4.56</td>
    //             <td>2.95</td>
    //           </tr>
    //           <tr>
    //             <td>2014</td>
    //             <td>19.71</td>
    //             <td>7.69</td>
    //             <td>4.7</td>
    //             <td>3.04</td>
    //           </tr>
    //           <tr>
    //             <td>2015</td>
    //             <td>21.21</td>
    //             <td>7.52</td>
    //             <td>4.22</td>
    //             <td>3.21</td>
    //           </tr>
    //           <tr>
    //             <td>2016</td>
    //             <td>24.38</td>
    //             <td>6.87</td>
    //             <td>4.15</td>
    //             <td>3.35</td>
    //           </tr>
    //           <tr>
    //             <td>2017</td>
    //             <td>24.72</td>
    //             <td>6.08</td>
    //             <td>4.39</td>
    //             <td>3.44</td>
    //           </tr>
    //           <tr>
    //             <td>2018</td>
    //             <td>23.71</td>
    //             <td>5.3</td>
    //             <td>4.39</td>
    //             <td>3.44</td>
    //           </tr>
    //         </tbody>
    //       </table>
    // `) as TemplateResult
  }
};


/*
{
  "datasets": [
    {
      "type": "pie",
      "title": "Division of energy in the Universe",
      "facets": {
        "x": {
          "label": "Kind of energy",
          "variableType": "independent",
          "measure": "nominal",
          "datatype": "string"
        },
        "y": {
          "label": "Proportion of total energy in the Universe",
          "variableType": "dependent",
          "measure": "ratio",
          "datatype": "number",
          "multiplier": 0.01
        }
      },
      "series": [
        {
          "key": "Proportion of total energy in the Universe",
          "theme": {
            "baseQuantity": "energy",
            "baseKind": "proportion",
            "entity": "the Universe",
            "aggregate": "total"
          },
          "records": [
            {
              "x": "Dark Energy",
              "y": "73"
            },
            {
              "x": "Dark Matter",
              "y": "23"
            },
            {
              "x": "Nonluminous Matter",
              "y": "3.6"
            },
            {
              "x": "Luminous Matter",
              "y": "0.4"
            }
          ]
        }
      ],
      "data": {
        "source": "inline"
      },
      "settings": {
        "sonification.isEnabled": true
      }
    }
  ]
}  
*/