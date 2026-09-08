import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: 'Charts/Heat Maps',
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart58: Story = {
  name: "Iris Flower Data Set (58)",
  args: {
    filename: 'manifests/scatter-manifest-iris-petal.json',
    forcecharttype: 'heatmap',
  }
}
