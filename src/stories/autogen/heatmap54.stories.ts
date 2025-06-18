import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Heatmap Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart54: Story = {
  name: "Iris Flower Data Set (54)",
  args: {
    filename: "manifests/scatter-manifest-iris-petal.json",
    forcecharttype: "heatmap",
  }
}
