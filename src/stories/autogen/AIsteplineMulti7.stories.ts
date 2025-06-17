import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Stepline Multi Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart7: Story = {
  name: "27: Adidas, Nike & Puma revenue comparison 2006 to 2018 (7)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-27.json",
    forcecharttype: "stepline",
  }
}
