import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Waterfall Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart59: Story = {
  name: "Sample data (59)",
  args: {
    filename: "manifests/waterfall-manifest-001.json",
    forcecharttype: "waterfall",
  }
}
