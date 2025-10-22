import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Stepline Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart40: Story = {
  name: "965: Annual performance of the Dow Jones Composite Index 2000 to 2019 (40)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-965.json",
    forcecharttype: "stepline",
  }
}
