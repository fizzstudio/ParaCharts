import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Scatter Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart47: Story = {
  name: "Iris Flower Data Set (47)",
  args: {
    filename: "manifests/scatter-manifest-iris-petal.json",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "scatter",
    /*keybindings: { // change to keybindingsFile: './sample_keybindings.json',
      "chart": {
        "a": {
          "action": "move_left"
        },
        "d": {
          "action": "move_right"
        },
        "w": {
          "action": "move_up"
        },
        "s": {
          "action": "move_down"
        }
      }
    },*/
  }
}
