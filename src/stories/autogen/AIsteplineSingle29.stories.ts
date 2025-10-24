import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Stepline Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart29: Story = {
  name: "595: Number of births in Canada 2000 to 2019 (29)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-595.json",
    forcecharttype: "stepline",
  }
}
