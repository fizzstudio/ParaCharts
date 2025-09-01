import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/pieTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Pastry Charts/Pie Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart47: Story = {
  name: "Division of energy in the Universe (47)",
  args: {
    filename: "manifests/pie-manifest-dark-matter.json",
    forcecharttype: "pie",
  },
  play: async ({canvas, userEvent}) => {
    await (new Runner(canvas, userEvent, expect)).run();
  }
}
