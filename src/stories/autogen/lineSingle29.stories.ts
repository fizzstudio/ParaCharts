import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Line Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart29: Story = {
  name: "913: Number of commercial casinos in the U.S. 2005 to 2018 (29)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-913.json",
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
