import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Stepline Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart9: Story = {
  name: "67: Gross domestic product of the BRIC countries from 2014 to 2024 (9)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-67.json",
    forcecharttype: "stepline",
  }
}
