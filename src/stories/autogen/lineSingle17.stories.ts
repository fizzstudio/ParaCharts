import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart17: Story = {
  name: "328: General Motors - number of employees 2019 (17)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-328.json",
    forcecharttype: "line",
  }
}
