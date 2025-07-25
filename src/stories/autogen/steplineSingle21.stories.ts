import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart21: Story = {
  name: "1107: Unemployment rate in Spain 2005 to 2019 (21)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-1107.json",
    forcecharttype: "stepline",
  }
}
