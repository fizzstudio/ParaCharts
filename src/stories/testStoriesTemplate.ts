export const template = `import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/%(chartType)sTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: 'Charts/%(typeFolder)s',
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart%(index)s: Story = {
  name: '%(manifestTitle)s',
  args: {
    filename: '%(manifestPath)s',
    forcecharttype: '%(chartType)s',
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest('%(manifestPath)s');
    await runner.run();
  }
}
`