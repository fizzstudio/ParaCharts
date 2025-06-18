import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart20: Story = {
  name: "1066: Median age of the population in Vietnam 2015 (20)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-1066.json",
    forcecharttype: "line",
  }
}
