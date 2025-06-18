import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Stepline Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart34: Story = {
  name: "881: FedEx's revenue 2009 to 2019 (34)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-881.json",
    forcecharttype: "stepline",
  }
}
