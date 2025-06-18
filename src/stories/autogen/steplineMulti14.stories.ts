import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Stepline Multi Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart14: Story = {
  name: "27: Adidas, Nike & Puma revenue comparison 2006 to 2018 (14)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-27.json",
    forcecharttype: "stepline",
  }
}
