import { Chart, type ChartProps } from '../Chart';
import { familyManifestPathsMap } from '../chartSelectorHelper';
import type { Meta, StoryObj } from "@storybook/web-components-vite";

type Story = StoryObj<ChartProps>;

const titleToFilenameMap = familyManifestPathsMap('candlestick', false);

const meta = {
  title: "Charts/Candlestick Charts",
  render: (args) => Chart(args),
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

export const AllCandlestickCharts: Story = {
  name: 'All Candlestick Charts',
  args: {
    filename: '',
    forcecharttype: "candlestick",
  }
};
