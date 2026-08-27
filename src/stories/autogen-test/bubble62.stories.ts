import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/bubbleTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: 'Charts/Bubble Charts',
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart62: Story = {
  name: 's2 (62)',
  args: {
    filename: 'manifests/scatter-manifest-s2.json',
    forcecharttype: 'bubble',
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest('manifests/scatter-manifest-s2.json');
    await runner.run();
  }
}
