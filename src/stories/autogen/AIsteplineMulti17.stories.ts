import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Multi Stepline Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart17: Story = {
  name: "76: Inflation rate in EU and Euro area 2024 (17)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-76.json",
    forcecharttype: "stepline",
  }
}
