import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart19: Story = {
  name: "489: Growth rate of the global cosmetics market 2004 to 2018 (19)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-489.json",
    forcecharttype: "line",
  }
}
