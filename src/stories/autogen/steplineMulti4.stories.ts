import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Stepline Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart4: Story = {
  name: "175: Distribution of gross domestic product (GDP) across economic sectors Pakistan 2018 (4)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-175.json",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "stepline",
  }
}
