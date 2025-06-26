import { AiChart, type ChartProps } from '../Chart';
import { familyManifestPathsMap } from '../chartSelectorHelper';
import type { Meta, StoryObj } from "@storybook/web-components-vite";

type Story = StoryObj<ChartProps>;

const titleToFilenameMap = familyManifestPathsMap('bar', true);

const meta = {
  title: "AI-enhanced Charts/Bar Charts/Multi Column Charts",
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

export const AllMultiColumnCharts: Story = {
  name: 'All Multi Column Charts',
  args: {
    filename: '',
    forcecharttype: "column",
  }
};
