import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart23: Story = {
  name: "172: Median household income in the United States 1990 to 2018 (23)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-172.json",
    forcecharttype: "stepline",
  }
}
