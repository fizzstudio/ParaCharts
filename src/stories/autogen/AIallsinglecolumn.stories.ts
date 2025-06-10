import { AiChart, type ChartProps } from '../Chart';
import { familyManifestPathsMap } from '../chartSelectorHelper';
import type { Meta, StoryObj } from "@storybook/web-components";

type Story = StoryObj<ChartProps>;

const titleToFilenameMap = familyManifestPathsMap('bar', true);

const meta = {
  title: "Ai-enhanced Charts/Column Single Charts",
  render: (args) => AiChart(args),
  argTypes: {
    filename: {
      description: 'Chart Title',
      control: {type: 'select'},
      options: Object.keys(titleToFilenameMap),
      mapping: titleToFilenameMap
    }
  },
} satisfies Meta<ChartProps>;

export default meta;

export const AllSingleColumnCharts: Story = {
  name: 'All Column Single Charts',
  args: {
    filename: '',
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "column",
  }
};
