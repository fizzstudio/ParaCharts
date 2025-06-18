import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart10: Story = {
  name: "16: Distribution of the workforce across economic sectors in India 2019 (10)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-16.json",
    forcecharttype: "line",
  }
}
