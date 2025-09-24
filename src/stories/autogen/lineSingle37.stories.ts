import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/lineTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Line Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart37: Story = {
  name: "930: Suicide rate in Japan 2009 to 2018 (37)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-930.json",
    forcecharttype: "line",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/autogen/line-single/line-single-manifest-930.json");
    await runner.run();
  }
}
