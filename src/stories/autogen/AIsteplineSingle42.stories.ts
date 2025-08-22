import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import { chartTypeTestMap } from '../test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Stepline Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart42: Story = {
  name: "Charizard: Holographic Charizard Card Price (42)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-Charizard.json",
    forcecharttype: "stepline",
  },
  play: async (playArgs) => {
    const testFunctions = chartTypeTestMap['stepline'];
    if (testFunctions && Array.isArray(testFunctions)) {
      for (const testFunction of testFunctions) {
        await testFunction(playArgs);
      }
    }
  }
}
