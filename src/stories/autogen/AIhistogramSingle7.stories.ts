import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Histograms",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart7: Story = {
  name: "13: Real GDP growth in the United States, by quarter 2011 to 2019 (7)",
  args: {
    filename: "manifests/autogen/bar-single/bar-single-manifest-13.json",
    forcecharttype: "histogram",
  }
}
