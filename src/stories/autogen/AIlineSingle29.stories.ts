import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart29: Story = {
  name: "913: Number of commercial casinos in the U.S. 2005 to 2018 (29)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-913.json",
    forcecharttype: "line",
  }
}
