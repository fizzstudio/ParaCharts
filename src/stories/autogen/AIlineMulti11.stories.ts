import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Multi Line Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart11: Story = {
  name: "175: Distribution of gross domestic product (GDP) across economic sectors Pakistan 2018 (11)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-175.json",
    forcecharttype: "line",
  }
}
