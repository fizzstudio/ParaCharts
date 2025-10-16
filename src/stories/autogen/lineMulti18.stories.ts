import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Multi Line Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart18: Story = {
  name: "Pokemon: Holographic Pokemon Card Price (18)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-Pokemon.json",
    forcecharttype: "line",
  }
}
