import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Stepline Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart23: Story = {
  name: "172: Median household income in the United States 1990 to 2018 (23)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-172.json",
    forcecharttype: "stepline",
  }
}
