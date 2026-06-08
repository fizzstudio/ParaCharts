import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Multi Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart47: Story = {
  name: "Expenses vs. Revenue (47)",
  args: {
    filename: "manifests/line-two-manifest.json",
    forcecharttype: "stepline",
  }
}
