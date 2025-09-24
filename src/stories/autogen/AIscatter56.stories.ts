import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/scatterTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Scatter Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart56: Story = {
  name: "s1 (56)",
  args: {
    filename: "manifests/scatter-manifest-s1.json",
    forcecharttype: "scatter",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/scatter-manifest-s1.json");
    await runner.run();
  }
}
