import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Stepline Multi Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart15: Story = {
  name: "57: Distribution of GDP across economic sectors in China 2008 to 2018 (15)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-57.json",
    forcecharttype: "stepline",
  }
}
