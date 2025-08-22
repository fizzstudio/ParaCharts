import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import { chartTypeTestMap } from '../test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Multi Line Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart15: Story = {
  name: "57: Distribution of GDP across economic sectors in China 2008 to 2018 (15)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-57.json",
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
