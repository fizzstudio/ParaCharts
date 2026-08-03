import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Bubble Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart68: Story = {
  name: "Pokemon statistics (68)",
  args: {
    filename: "manifests/pokemon-multi-facet-manifest.json",
    forcecharttype: "bubble",
  }
}
