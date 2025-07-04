import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Ai-enhanced Charts/Stepline Multi Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart2: Story = {
  name: "128: Gross domestic product (GDP) growth in EU and Euro area 2024 (2)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-128.json",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "stepline",
  }
}
