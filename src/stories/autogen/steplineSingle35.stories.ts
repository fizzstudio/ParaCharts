import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart35: Story = {
  name: "887: Youth unemployment rate in India in 2019 (35)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-887.json",
    forcecharttype: "stepline",
  }
}
