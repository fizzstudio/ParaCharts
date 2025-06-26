import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Histograms",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart6: Story = {
  name: "1018: Unemployment rate in Greece 1999-2019 (6)",
  args: {
    filename: "manifests/autogen/bar-single/bar-single-manifest-1018.json",
    forcecharttype: "histogram",
  }
}
