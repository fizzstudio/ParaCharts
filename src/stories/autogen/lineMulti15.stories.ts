import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Multi Line Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart15: Story = {
  name: "57: Distribution of GDP across economic sectors in China 2008 to 2018 (15)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-57.json",
    forcecharttype: "line",
  }
}
