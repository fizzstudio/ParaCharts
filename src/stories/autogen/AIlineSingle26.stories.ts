import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/lineTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Line Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart26: Story = {
  name: "489: Growth rate of the global cosmetics market 2004 to 2018 (26)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-489.json",
    forcecharttype: "line",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/autogen/line-single/line-single-manifest-489.json");
    await runner.run();
  }
}
