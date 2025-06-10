import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart26: Story = {
  name: "843: New York Yankees revenue 2001 to 2018 (26)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-843.json",
    forcecharttype: "line",
  }
}
