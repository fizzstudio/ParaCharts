import { Chart, type ChartProps } from '../Chart';
import { familyManifestPathsMap } from '../chartSelectorHelper';
import type { Meta, StoryObj } from "@storybook/web-components";

type Story = StoryObj<ChartProps>;

const titleToFilenameMap = familyManifestPathsMap('bar', true);

const meta = {
  title: "Basic Charts/Bar Multi Charts",
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

export const AllMultiBarCharts: Story = {
  name: 'All Bar Multi Charts',
  args: {
    filename: '',
    forcecharttype: "bar",
  }
};
