import { AiChart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/bubbleTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "AI-enhanced Charts/Bubble Charts",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const AiChart67: Story = {
  name: "DataPanelWHR2019 National statistics (67)",
  args: {
    filename: "manifests/DataPanelWHR2019-multi-facet-manifest.json",
    forcecharttype: "bubble",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/DataPanelWHR2019-multi-facet-manifest.json");
    await runner.run();
  }
}
