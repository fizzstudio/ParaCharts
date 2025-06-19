import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Histograms",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart8: Story = {
  name: "27: Spotify's premium subscribers 2015 to 2019 (8)",
  args: {
    filename: "manifests/autogen/bar-single/bar-single-manifest-27.json",
    forcecharttype: "histogram",
  }
}
