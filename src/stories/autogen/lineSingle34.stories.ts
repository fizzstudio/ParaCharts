import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Line Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart34: Story = {
  name: "881: FedEx's revenue 2009 to 2019 (34)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-881.json",
    forcecharttype: "line",
  }
}
