import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Bar Charts/Multi Lollipop Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart0: Story = {
  name: "14: College enrollment in public and private institutions in the U.S. 1965 to 2028 (0)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-14.json",
    forcecharttype: "lollipop",
  }
}
