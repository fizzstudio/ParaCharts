import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Ai-enhanced Charts/Stepline Single Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart31: Story = {
  name: "937: Movie releases in North America from 2000 to 2019 (31)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-937.json",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "stepline",
  }
}
