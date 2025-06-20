import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Stepline Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart11: Story = {
  name: "Pokemon: Holographic Pokemon Card Price (11)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-Pokemon.json",
    forcecharttype: "stepline",
  }
}
