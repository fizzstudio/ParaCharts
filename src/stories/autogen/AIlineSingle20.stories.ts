import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart20: Story = {
  name: "508: Indonesia: number of internet users 2017 to 2023 (20)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-508.json",
    forcecharttype: "line",
  }
}
