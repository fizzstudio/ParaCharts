import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/heatmapTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Charts/Heat Maps",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart55: Story = {
  name: "Old Faithful Geyser Eruptions (55)",
  args: {
    filename: "manifests/scatter-manifest-geyser.json",
    forcecharttype: "heatmap",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/scatter-manifest-geyser.json");
    await runner.run();
  }
}
