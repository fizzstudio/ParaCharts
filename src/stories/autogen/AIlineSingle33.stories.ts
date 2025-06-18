import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart33: Story = {
  name: "843: New York Yankees revenue 2001 to 2018 (33)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-843.json",
    forcecharttype: "line",
  }
}
