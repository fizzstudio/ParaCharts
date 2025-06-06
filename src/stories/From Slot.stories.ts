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

    /*
    type: {
      description: 'Type of chart',
      control: {type: 'select'},
      options: ['bar', 'line']
    },
*/
    // height: {
    //     description: "Height of chart",
    //     control: {
    //         type: "number",
    //         min: 100,
    //     }
    // },
/*
    summary: {
      description: 'Accessible summary',
      control: 'text'
    },

*/
/*
    dataFile: {
      description: 'File where data is located.',
      control: 'text'
    }
*/
  }
} satisfies Meta<ChartProps>;

export default meta;
type Story = StoryObj<ChartProps>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const FromSlot: Story = {
  args: {
    filename: "",
    forcecharttype: "pie",
    summary: '',
    chartTitle: '',
    xAxisLabel: '',
    yAxisLabel: '',
    configFile: "./sample_config.json",
    keybindingsFile: './sample_keybindings.json',
    slot: unsafeHTML(`
          <table>
          <caption>Division of energy in the Universe (Table)</caption>
          <thead>
            <tr>
              <th>Kind of energy</th>
              <th>Proportion</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dark Energy</td>
              <td>73%</td>
            </tr>
            <tr>
              <td>Dark Matter</td>
              <td>23%</td>
            </tr>
            <tr>
              <td>Nonluminous Matter</td>
              <td>3.6%</td>
            </tr>
            <tr>
              <td>Luminous Matter</td>
              <td>0.4%</td>
            </tr>
          </tbody>
        </table>
    `) as TemplateResult
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