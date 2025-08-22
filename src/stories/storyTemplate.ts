export const template = `import { %(chartElement)s, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import { chartTypeTestMap } from '../tests';

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
    forcecharttype: "%(chartType)s",
  },
  play: async (playArgs) => {
    const testFunctions = chartTypeTestMap['%(chartType)s'];
    if (testFunctions && Array.isArray(testFunctions)) {
      for (const testFunction of testFunctions) {
        await testFunction(playArgs);
      }
    }
  }
}
`