import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart9: Story = {
  name: "128: Gross domestic product (GDP) growth in EU and Euro area 2024 (9)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-128.json",
    forcecharttype: "line",
  }
}
