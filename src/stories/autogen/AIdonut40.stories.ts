import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Donut Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart40: Story = {
  name: "Division of energy in the Universe (40)",
  args: {
    filename: "manifests/pie-manifest-dark-matter.json",
    forcecharttype: "donut",
  }
}
