import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Stepline Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart38: Story = {
  name: "937: Movie releases in North America from 2000 to 2019 (38)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-937.json",
    forcecharttype: "stepline",
  }
}
