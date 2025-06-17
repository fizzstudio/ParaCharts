import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Histogram Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart1: Story = {
  name: "1018: Unemployment rate in Greece 1999-2019 (1)",
  args: {
    filename: "manifests/autogen/bar-single/bar-single-manifest-1018.json",
    forcecharttype: "histogram",
  }
}
