import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart12: Story = {
  name: "1047: Number of Xbox Live MAU Q1 2016 - Q4 2019 (12)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-1047.json",
    forcecharttype: "line",
  }
}
