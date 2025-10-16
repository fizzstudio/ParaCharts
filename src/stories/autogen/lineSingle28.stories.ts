import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Line Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart28: Story = {
  name: "541: USA - number of arrests for all offenses 1990 to 2018 (28)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-541.json",
    forcecharttype: "line",
  }
}
