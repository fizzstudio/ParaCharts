import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Charts/Bar Charts/Single Bar Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart45: Story = {
  name: "Sales (45)",
  args: {
    filename: "manifests/combo-manifest-ms.json",
    forcecharttype: "bar",
  }
}
