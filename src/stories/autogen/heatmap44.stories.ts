import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Heatmap Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart44: Story = {
  name: "Old Faithful Geyser Eruptions (44)",
  args: {
    filename: "manifests/scatter-manifest-geyser.json",
    forcecharttype: "heatmap",
  }
}
