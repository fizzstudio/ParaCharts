import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Stepline Single Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart39: Story = {
  name: "951: National debt of Ireland 2024 (39)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-951.json",
    forcecharttype: "stepline",
  }
}
