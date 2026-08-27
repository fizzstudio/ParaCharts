import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/vennTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Charts/Venn Diagrams",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart63: Story = {
  name: "Animals by habitat (63)",
  args: {
    filename: "manifests/venn-manifest-1.json",
    forcecharttype: "venn",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/venn-manifest-1.json");
    await runner.run();
  }
}
