import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Bar Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart1: Story = {
  name: "149: Class 8 truck manufacturers - sales 2007 to 2018 (1)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-149.json",
    forcecharttype: "bar",
  }
}
