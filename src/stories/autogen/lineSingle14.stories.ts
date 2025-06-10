import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart14: Story = {
  name: "1107: Unemployment rate in Spain 2005 to 2019 (14)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-1107.json",
    forcecharttype: "line",
  }
}
