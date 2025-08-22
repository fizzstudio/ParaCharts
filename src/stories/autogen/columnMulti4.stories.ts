import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import { chartTypeTestMap } from '../test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Bar Charts/Multi Column Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart4: Story = {
  name: "48: Gross domestic product of the ASEAN countries from 2008 to 2018 (4)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-48.json",
    forcecharttype: "column",
  },
  play: async (playArgs) => {
    const testFunctions = chartTypeTestMap['column'];
    if (testFunctions && Array.isArray(testFunctions)) {
      for (const testFunction of testFunctions) {
        await testFunction(playArgs);
      }
    }
  }
}
