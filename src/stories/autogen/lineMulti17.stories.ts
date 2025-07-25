import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Multi Line Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart17: Story = {
  name: "76: Inflation rate in EU and Euro area 2024 (17)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-76.json",
    forcecharttype: "line",
  }
}
