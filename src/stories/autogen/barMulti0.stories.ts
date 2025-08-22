import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import { chartTypeTestMap } from '../test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Bar Charts/Multi Bar Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart0: Story = {
  name: "14: College enrollment in public and private institutions in the U.S. 1965 to 2028 (0)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-14.json",
    forcecharttype: "bar",
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
