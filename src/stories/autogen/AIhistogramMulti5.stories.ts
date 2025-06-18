import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Histogram Multi Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart5: Story = {
  name: "61: Age distribution in India 2008 to 2018 (5)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-61.json",
    forcecharttype: "histogram",
  }
}
