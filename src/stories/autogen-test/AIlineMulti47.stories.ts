import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/lineTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Multi Line Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart47: Story = {
  name: "Expenses vs. Revenue (47)",
  args: {
    filename: "manifests/line-two-manifest.json",
    forcecharttype: "line",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/line-two-manifest.json");
    await runner.run();
  }
}
