import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Bar Charts/Multi Bar Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart4: Story = {
  name: "48: Gross domestic product of the ASEAN countries from 2008 to 2018 (4)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-48.json",
    forcecharttype: "bar",
  }
}
