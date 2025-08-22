import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import { chartTypeTestMap } from '../test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Multi Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart9: Story = {
  name: "128: Gross domestic product (GDP) growth in EU and Euro area 2024 (9)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-128.json",
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
