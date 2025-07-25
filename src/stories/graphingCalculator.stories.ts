import { Chart, type ChartProps } from './Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const GraphingCalculator0: Story = {
  name: "Graphing Calculator",
  args: {
    filename: "",
    forcecharttype: "graph",
    config: {
    }
  }
}