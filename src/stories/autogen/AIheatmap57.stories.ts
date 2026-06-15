import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Heat Maps",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart57: Story = {
  name: "s1 (57)",
  args: {
    filename: "manifests/scatter-manifest-s1.json",
    forcecharttype: "heatmap",
  }
}
