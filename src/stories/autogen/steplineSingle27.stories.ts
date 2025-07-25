import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart27: Story = {
  name: "508: Indonesia: number of internet users 2017 to 2023 (27)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-508.json",
    forcecharttype: "stepline",
  }
}
