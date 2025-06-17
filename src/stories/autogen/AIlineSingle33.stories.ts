import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart33: Story = {
  name: "965: Annual performance of the Dow Jones Composite Index 2000 to 2019 (33)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-965.json",
    forcecharttype: "line",
  }
}
