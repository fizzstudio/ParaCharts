import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Multi Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart3: Story = {
  name: "16: Distribution of the workforce across economic sectors in India 2019 (3)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-16.json",
    forcecharttype: "line",
  }
}
