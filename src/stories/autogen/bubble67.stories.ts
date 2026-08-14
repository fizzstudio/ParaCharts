import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Bubble Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart67: Story = {
  name: "DataPanelWHR2019 National statistics (67)",
  args: {
    filename: "manifests/DataPanelWHR2019-multi-facet-manifest.json",
    forcecharttype: "bubble",
  }
}
