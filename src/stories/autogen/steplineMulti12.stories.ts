import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Multi Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart12: Story = {
  name: "233: Advertising spending in Vietnam 2004-2018, by medium (12)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-233.json",
    forcecharttype: "stepline",
  }
}
