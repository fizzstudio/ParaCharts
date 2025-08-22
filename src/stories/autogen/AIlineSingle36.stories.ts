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

export const AiChart36: Story = {
  name: "913: Number of commercial casinos in the U.S. 2005 to 2018 (36)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-913.json",
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
