import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: 'Charts/Waterfall Charts',
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart66: Story = {
  name: "Acme Corp EBITDA Gross Margin (66)",
  args: {
    filename: 'manifests/waterfall-manifest-002.json',
    forcecharttype: 'waterfall',
  }
}
