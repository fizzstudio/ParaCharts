import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Stepline Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart22: Story = {
  name: "128: Cattle population worldwide 2012 to 2019 (22)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-128.json",
    forcecharttype: "stepline",
  }
}
