import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/Donut Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart40: Story = {
  name: "Division of energy in the Universe (40)",
  args: {
    filename: "manifests/pie-manifest-dark-matter.json",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "donut",
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
