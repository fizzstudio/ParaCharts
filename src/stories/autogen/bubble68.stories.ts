import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Bubble Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart68: Story = {
  name: "Pokemon statistics (68)",
  args: {
    filename: "manifests/pokemon-multi-facet-manifest.json",
    forcecharttype: "bubble",
  }
}
