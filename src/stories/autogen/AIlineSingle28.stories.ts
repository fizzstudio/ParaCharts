import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Line Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart28: Story = {
  name: "541: USA - number of arrests for all offenses 1990 to 2018 (28)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-541.json",
    forcecharttype: "line",
  }
}
