import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Bar Charts/Single Bar Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart7: Story = {
  name: "13: Real GDP growth in the United States, by quarter 2011 to 2019 (7)",
  args: {
    filename: "manifests/autogen/bar-single/bar-single-manifest-13.json",
    forcecharttype: "bar",
  }
}
