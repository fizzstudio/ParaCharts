export const allTemplate = `import { %(manifestsMap)s } from "../autogen-manifest-paths";
import { Chart, type ChartProps } from '../Chart';
import type { Meta, StoryObj } from "@storybook/web-components";

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart/%(chartFolder)s",
  render: (args) => Chart(args),
  argTypes: {
    manifest: {
      description: 'Chart Title',
      control: {type: 'select'},
      options: Object.keys(%(manifestsMap)s)
    }
  },
} satisfies Meta<ChartProps>;

export default meta;

export const %(storyName)s: Story = {
  name: 'All %(chartFolder)s',
  args: {
    fileName: '',
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
    }*/
  }
};
`;