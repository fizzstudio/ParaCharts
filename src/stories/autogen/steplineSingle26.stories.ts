import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart26: Story = {
  name: "489: Growth rate of the global cosmetics market 2004 to 2018 (26)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-489.json",
    forcecharttype: "stepline",
  }
}
