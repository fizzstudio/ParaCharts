import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import { chartTypeTestMap } from '../test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Bar Charts/Single Lollipop Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart8: Story = {
  name: "27: Spotify's premium subscribers 2015 to 2019 (8)",
  args: {
    filename: "manifests/autogen/bar-single/bar-single-manifest-27.json",
    forcecharttype: "lollipop",
  },
  play: async (playArgs) => {
    const testFunctions = chartTypeTestMap['lollipop'];
    if (testFunctions && Array.isArray(testFunctions)) {
      for (const testFunction of testFunctions) {
        await testFunction(playArgs);
      }
    }
  }
}
