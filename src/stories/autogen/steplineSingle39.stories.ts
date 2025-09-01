import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/steplineTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Single Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart39: Story = {
  name: "951: National debt of Ireland 2024 (39)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-951.json",
    forcecharttype: "stepline",
  },
  play: async ({canvas, userEvent}) => {
    await (new Runner(canvas, userEvent, expect)).run();
  }
}
