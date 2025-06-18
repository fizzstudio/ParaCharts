import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Lollipop Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart0: Story = {
  name: "14: College enrollment in public and private institutions in the U.S. 1965 to 2028 (0)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-14.json",
    forcecharttype: "lollipop",
  }
}
