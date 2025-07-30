import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Line Charts/Single Stepline Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart19: Story = {
  name: "1047: Number of Xbox Live MAU Q1 2016 - Q4 2019 (19)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-1047.json",
    forcecharttype: "stepline",
  },
  play: async ({ canvas, userEvent }) => {
    const parachart = await canvas.findByTestId('para-chart');
    await expect(parachart).toBeInTheDocument();
  }
}
