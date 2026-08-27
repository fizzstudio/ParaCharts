import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/pieTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Charts/Pastry Charts/Pie Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart50: Story = {
  name: "Division of energy in the Universe (50)",
  args: {
    filename: "manifests/pie-manifest-dark-matter.json",
    forcecharttype: "pie",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/pie-manifest-dark-matter.json");
    await runner.run();
  }
}
