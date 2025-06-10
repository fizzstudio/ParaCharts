import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Stepline Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart25: Story = {
  name: "746: Inflation rate in Sri Lanka 2024 (25)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-746.json",
    forcecharttype: "stepline",
  }
}
