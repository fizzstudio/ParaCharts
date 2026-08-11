import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Waterfall Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart63: Story = {
  name: "Acme Corp Share Price (63)",
  args: {
    filename: "manifests/waterfall-manifest-001.json",
    forcecharttype: "waterfall",
  }
}
