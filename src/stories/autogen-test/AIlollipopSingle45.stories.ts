import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/lollipopTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Bar Charts/Single Lollipop Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart45: Story = {
  name: "Sales (45)",
  args: {
    filename: "manifests/combo-manifest-ms.json",
    forcecharttype: "lollipop",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/combo-manifest-ms.json");
    await runner.run();
  }
}
