import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Pastry Charts/Donut Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart49: Story = {
  name: "Division of energy in the Universe (49)",
  args: {
    filename: "manifests/pie-manifest-dark-matter.json",
    forcecharttype: "donut",
  }
}
