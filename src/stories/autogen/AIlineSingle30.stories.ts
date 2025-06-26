import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Line Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart30: Story = {
  name: "605: Samsung Electronics' operating profit 2009-2019, by quarter (30)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-605.json",
    forcecharttype: "line",
  }
}
