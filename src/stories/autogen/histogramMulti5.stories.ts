import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Histogram Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart5: Story = {
  name: "61: Age distribution in India 2008 to 2018 (5)",
  args: {
    filename: "manifests/autogen/bar-multi/bar-multi-manifest-61.json",
    forcecharttype: "histogram",
  }
}
