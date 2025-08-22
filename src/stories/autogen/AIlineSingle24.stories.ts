import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import { chartTypeTestMap } from '../test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Line Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart24: Story = {
  name: "328: General Motors - number of employees 2019 (24)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-328.json",
    forcecharttype: "line",
  },
  play: async (playArgs) => {
    const testFunctions = chartTypeTestMap['line'];
    if (testFunctions && Array.isArray(testFunctions)) {
      for (const testFunction of testFunctions) {
        await testFunction(playArgs);
      }
    }
  }
}
