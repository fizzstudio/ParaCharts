import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/waterfallTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Waterfall Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart62: Story = {
  name: "Sample data (62)",
  args: {
    filename: "manifests/waterfall-manifest-004.json",
    forcecharttype: "waterfall",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/waterfall-manifest-004.json");
    await runner.run();
  }
}
