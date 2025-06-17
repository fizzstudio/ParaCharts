import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Stepline Multi Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart9: Story = {
  name: "67: Gross domestic product of the BRIC countries from 2014 to 2024 (9)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-67.json",
    forcecharttype: "stepline",
  }
}
