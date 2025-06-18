import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Stepline Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart20: Story = {
  name: "1066: Median age of the population in Vietnam 2015 (20)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-1066.json",
    forcecharttype: "stepline",
  }
}
