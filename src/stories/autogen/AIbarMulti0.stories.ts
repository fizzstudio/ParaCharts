import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Ai-enhanced Charts/Bar Multi Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart0: Story = {
  name: "48: Gross domestic product of the ASEAN countries from 2008 to 2018 (0)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-48.json",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "bar",
  }
}
