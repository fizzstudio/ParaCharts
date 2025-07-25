import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart25: Story = {
  name: "375: Tesla's revenue 2008 to 2019 (25)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-375.json",
    forcecharttype: "stepline",
  }
}
