import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart24: Story = {
  name: "7: Estimated number of World of Warcraft subscribers 2015 to 2023 (24)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-7.json",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "line",
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
