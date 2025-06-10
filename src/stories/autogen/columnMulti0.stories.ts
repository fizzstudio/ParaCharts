import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Column Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart0: Story = {
  name: "48: Gross domestic product of the ASEAN countries from 2008 to 2018 (0)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-48.json",
    forcecharttype: "column",
  }
}
