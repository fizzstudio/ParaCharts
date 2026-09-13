import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: 'Charts/Scatter Charts',
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart55: Story = {
  name: "Old Faithful Geyser Eruptions (55)",
  args: {
    filename: 'manifests/scatter-manifest-geyser.json',
    forcecharttype: 'scatter',
  }
}
