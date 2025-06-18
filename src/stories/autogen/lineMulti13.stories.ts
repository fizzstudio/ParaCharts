import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart13: Story = {
  name: "261: Passenger cars - sales in selected countries worldwide 2005 to 2018 (13)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-261.json",
    forcecharttype: "line",
  }
}
