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

export const Chart30: Story = {
  name: "605: Samsung Electronics' operating profit 2009-2019, by quarter (30)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-605.json",
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
