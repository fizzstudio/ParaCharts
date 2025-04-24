import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Line Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart5: Story = {
  name: "233: Advertising spending in Vietnam 2004-2018, by medium (5)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-233.json",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
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
