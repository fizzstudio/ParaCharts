import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Stepline Multi Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart13: Story = {
  name: "261: Passenger cars - sales in selected countries worldwide 2005 to 2018 (13)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-261.json",
    forcecharttype: "stepline",
  }
}
