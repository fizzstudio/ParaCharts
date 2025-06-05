import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Line Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart6: Story = {
  name: "261: Passenger cars - sales in selected countries worldwide 2005 to 2018 (6)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-261.json",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "line",
  }
}
