import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/scatterTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Charts/Scatter Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart53: Story = {
  name: "d3 (53)",
  args: {
    filename: "manifests/scatter-manifest-d3.json",
    forcecharttype: "scatter",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/scatter-manifest-d3.json");
    await runner.run();
  }
}
