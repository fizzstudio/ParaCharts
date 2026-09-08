export const template = `import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: 'Charts/%(typeFolder)s',
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart%(index)s: Story = {
  name: "%(manifestTitle)s",
  args: {
    filename: '%(manifestPath)s',
    forcecharttype: '%(chartType)s',
  }
}
`