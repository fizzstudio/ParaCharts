import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart23: Story = {
  name: "605: Samsung Electronics' operating profit 2009-2019, by quarter (23)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-605.json",
    forcecharttype: "line",
  }
}
