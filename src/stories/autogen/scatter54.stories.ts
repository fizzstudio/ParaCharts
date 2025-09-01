import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/scatterTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Scatter Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart54: Story = {
  name: "Iris Flower Data Set (54)",
  args: {
    filename: "manifests/scatter-manifest-iris-petal.json",
    forcecharttype: "scatter",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/scatter-manifest-iris-petal.json");
    await runner.run();
  }
}
