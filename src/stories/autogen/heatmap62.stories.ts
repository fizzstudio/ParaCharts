import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Charts/Heat Maps",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart62: Story = {
  name: "s2 (62)",
  args: {
    filename: "manifests/scatter-manifest-s2.json",
    forcecharttype: "heatmap",
  }
}
