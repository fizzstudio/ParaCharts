import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart24: Story = {
  name: "328: General Motors - number of employees 2019 (24)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-328.json",
    forcecharttype: "line",
  }
}
