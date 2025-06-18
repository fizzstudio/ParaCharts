import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Stepline Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart31: Story = {
  name: "7: Estimated number of World of Warcraft subscribers 2015 to 2023 (31)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-7.json",
    forcecharttype: "stepline",
  }
}
