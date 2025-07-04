import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Ai-enhanced Charts/Lollipop Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart1: Story = {
  name: "1018: Unemployment rate in Greece 1999-2019 (1)",
  args: {
    filename: "manifests/autogen/bar-single/bar-single-manifest-1018.json",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "lollipop",
  }
}
