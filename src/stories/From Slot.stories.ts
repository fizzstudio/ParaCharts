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
    
    type: {
      description: 'Type of chart',
      control: {type: 'select'},
      options: ['bar', 'line']
    },
    
    // height: {
    //     description: "Height of chart",
    //     control: {
    //         type: "number",
    //         min: 100,
    //     }
    // },
    
    summary: {
      description: 'Accessible summary',
      control: 'text'
    },
    
   
    dataFile: {
      description: 'File where data is located.',
      control: 'text'
    }
      
  }
} satisfies Meta<ChartProps>;

export default meta;
type Story = StoryObj<ChartProps>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const FromSlot: Story = {
  args: {
    type: "bar",
    summary: '',
    chartTitle: '',
    xAxisLabel: '',
    yAxisLabel: '',
    configFile: "./sample_config.json",
    keybindingsFile: './sample_keybindings.json',
    slot: unsafeHTML(`
      <table>
        <tr>
          <td data-type="string" data-independent="true">Category</td>
          <td data-type="number">Count</td>
        </tr>
        <tr>
          <td>A</td>
          <td>2</td>
        </tr>
        <tr>
          <td>B</td>
          <td>5</td>
        </tr>
      </table>
    `) as TemplateResult
  }
};
