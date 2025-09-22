import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/barTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Bar Charts/Multi Bar Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart2: Story = {
  name: "15: Facebook: annual revenue and net income 2007 to 2019 (2)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-15.json",
    forcecharttype: "bar",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/autogen/bar-multi/bar-multi-manifest-15.json");
    await runner.run();
  }
}
