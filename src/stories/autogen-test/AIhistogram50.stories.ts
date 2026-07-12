import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/histogramTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Histograms",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart50: Story = {
  name: "d3 (50)",
  args: {
    filename: "manifests/scatter-manifest-d3.json",
    forcecharttype: "histogram",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/scatter-manifest-d3.json");
    await runner.run();
  }
}
