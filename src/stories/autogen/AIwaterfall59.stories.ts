import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Waterfall Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart59: Story = {
  name: "Sample data (59)",
  args: {
    filename: "manifests/waterfall-manifest-001.json",
    forcecharttype: "waterfall",
  }
}
