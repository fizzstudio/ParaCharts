import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/donutTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Pastry Charts/Donut Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart47: Story = {
  name: "Division of energy in the Universe (47)",
  args: {
    filename: "manifests/pie-manifest-dark-matter.json",
    forcecharttype: "donut",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/pie-manifest-dark-matter.json");
    await runner.run();
  }
}
