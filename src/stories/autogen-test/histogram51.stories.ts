import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/histogramTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Histograms",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart51: Story = {
  name: "d3 (51)",
  args: {
    filename: "manifests/scatter-manifest-d3.json",
    forcecharttype: "histogram",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/scatter-manifest-d3.json");
    await runner.run();
  }
}
