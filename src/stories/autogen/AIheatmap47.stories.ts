import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Heatmap Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart47: Story = {
  name: "Iris Flower Data Set (47)",
  args: {
    filename: "manifests/scatter-manifest-iris-petal.json",
    forcecharttype: "heatmap",
  }
}
