import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import { chartTypeTestMap } from '../test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Heat Maps",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart51: Story = {
  name: "Old Faithful Geyser Eruptions (51)",
  args: {
    filename: "manifests/scatter-manifest-geyser.json",
    forcecharttype: "heatmap",
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
