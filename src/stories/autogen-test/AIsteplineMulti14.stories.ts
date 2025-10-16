import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/steplineTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Multi Stepline Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart14: Story = {
  name: "27: Adidas, Nike & Puma revenue comparison 2006 to 2018 (14)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-27.json",
    forcecharttype: "stepline",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/autogen/line-multi/line-multi-manifest-27.json");
    await runner.run();
  }
}
