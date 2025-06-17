import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart28: Story = {
  name: "887: Youth unemployment rate in India in 2019 (28)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-887.json",
    forcecharttype: "line",
  }
}
