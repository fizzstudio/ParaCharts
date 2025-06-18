import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Stepline Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart35: Story = {
  name: "887: Youth unemployment rate in India in 2019 (35)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-887.json",
    forcecharttype: "stepline",
  }
}
