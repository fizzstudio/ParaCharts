import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Stepline Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart40: Story = {
  name: "965: Annual performance of the Dow Jones Composite Index 2000 to 2019 (40)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-965.json",
    forcecharttype: "stepline",
  }
}
