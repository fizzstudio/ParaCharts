import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Line Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart41: Story = {
  name: "979: Total number of gang-related homicides in the United States 2012 (41)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-979.json",
    forcecharttype: "line",
  }
}
