export const allTemplate = `import { %(chartElement)s, type ChartProps } from '../Chart';
import { familyManifestPathsMap } from '../chartSelectorHelper';
import type { Meta, StoryObj } from "@storybook/web-components";

type Story = StoryObj<ChartProps>;

const titleToFilenameMap = familyManifestPathsMap('%(family)s', %(multi)s);

const meta = {
  title: "%(topFolder)s/%(typeFolder)s",
  render: (args) => %(chartElement)s(args),
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

export const %(storyName)s: Story = {
  name: 'All %(typeFolder)s',
  args: {
    filename: '',
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "%(chartType)s",
  }
};
`;