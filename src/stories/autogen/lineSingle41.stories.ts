import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart41: Story = {
  name: "979: Total number of gang-related homicides in the United States 2012 (41)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-979.json",
    forcecharttype: "line",
  }
}
