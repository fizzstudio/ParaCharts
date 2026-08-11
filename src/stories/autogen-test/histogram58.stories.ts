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

export const Chart58: Story = {
  name: "s1 (58)",
  args: {
    filename: "manifests/scatter-manifest-s1.json",
    forcecharttype: "histogram",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/scatter-manifest-s1.json");
    await runner.run();
  }
}
