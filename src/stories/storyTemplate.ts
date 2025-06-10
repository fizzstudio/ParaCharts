export const template = `import { %(chartElement)s, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "%(topFolder)s/%(typeFolder)s",
  render: (args) => %(chartElement)s(args),
} satisfies Meta<ChartProps>;

export default meta;

export const %(chartElement)s%(index)s: Story = {
  name: "%(manifestTitle)s",
  args: {
    filename: "%(manifestPath)s",
    config: { // change to configFile: "./sample_config.json",
      "ui.colorVisionMode": "deutan"
    },
    forcecharttype: "%(chartType)s",
  }
}
`