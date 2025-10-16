import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Line Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart22: Story = {
  name: "128: Cattle population worldwide 2012 to 2019 (22)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-128.json",
    forcecharttype: "line",
  }
}
