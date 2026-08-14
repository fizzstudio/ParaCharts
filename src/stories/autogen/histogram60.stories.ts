import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Histograms",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart60: Story = {
  name: "s2 (60)",
  args: {
    filename: "manifests/scatter-manifest-s2.json",
    forcecharttype: "histogram",
  }
}
