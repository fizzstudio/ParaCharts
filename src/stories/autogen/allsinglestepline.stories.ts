import { Chart, type ChartProps } from '../Chart';
import { familyManifestPathsMap } from '../chartSelectorHelper';
import type { Meta, StoryObj } from "@storybook/web-components";

type Story = StoryObj<ChartProps>;

const titleToFilenameMap = familyManifestPathsMap('line', true);

const meta = {
  title: "Basic Charts/Stepline Single Charts",
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

export const AllSingleSteplineCharts: Story = {
  name: 'All Stepline Single Charts',
  args: {
    filename: '',
    forcecharttype: "stepline",
  }
};
