import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/lollipopTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Bar Charts/Multi Lollipop Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart1: Story = {
  name: "149: Class 8 truck manufacturers - sales 2007 to 2018 (1)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-149.json",
    forcecharttype: "lollipop",
  },
  play: async ({canvas, userEvent}) => {
    await (new Runner(canvas, userEvent, expect)).run();
  }
}
