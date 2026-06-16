import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Waterfall Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart65: Story = {
  name: "Acme Corp EBITDA Net Margin (65)",
  args: {
    filename: "manifests/waterfall-manifest-004.json",
    forcecharttype: "waterfall",
  }
}
