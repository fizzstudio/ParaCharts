import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Multi Stepline Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart12: Story = {
  name: "233: Advertising spending in Vietnam 2004-2018, by medium (12)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-233.json",
    forcecharttype: "stepline",
  }
}
