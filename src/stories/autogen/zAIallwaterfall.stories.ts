import { AiChart, type ChartProps } from '../Chart';
import { familyManifestPathsMap } from '../chartSelectorHelper';
import type { Meta, StoryObj } from "@storybook/web-components-vite";

type Story = StoryObj<ChartProps>;

const titleToFilenameMap = familyManifestPathsMap('waterfall', false);

const meta = {
  title: "AI-enhanced Charts/Waterfall Charts",
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

export const AllAIWaterfallCharts: Story = {
  name: 'All Waterfall Charts',
  args: {
    filename: '',
    forcecharttype: "waterfall",
  }
};
