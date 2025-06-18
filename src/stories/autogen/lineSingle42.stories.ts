import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart42: Story = {
  name: "Charizard: Holographic Charizard Card Price (42)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-Charizard.json",
    forcecharttype: "line",
  }
}
