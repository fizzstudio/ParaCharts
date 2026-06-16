import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Scatter Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart55: Story = {
  name: "Iris Flower Data Set (55)",
  args: {
    filename: "manifests/scatter-manifest-iris-petal.json",
    forcecharttype: "scatter",
  }
}
