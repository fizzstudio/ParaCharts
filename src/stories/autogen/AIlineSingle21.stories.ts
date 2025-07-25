import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Line Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart21: Story = {
  name: "1107: Unemployment rate in Spain 2005 to 2019 (21)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-1107.json",
    forcecharttype: "line",
  }
}
