import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import { chartTypeTestMap } from '../test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Line Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart23: Story = {
  name: "172: Median household income in the United States 1990 to 2018 (23)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-172.json",
    forcecharttype: "line",
  },
  play: async (playArgs) => {
    const testFunctions = chartTypeTestMap[chartType];
    if (testFunctions && Array.isArray(testFunctions)) {
      for (const testFunction of testFunctions) {
        await testFunction(playArgs);
      }
    }
  }
}
