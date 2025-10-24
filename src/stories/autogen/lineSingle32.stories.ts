import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Line Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart32: Story = {
  name: "746: Inflation rate in Sri Lanka 2024 (32)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-746.json",
    forcecharttype: "line",
  }
}
