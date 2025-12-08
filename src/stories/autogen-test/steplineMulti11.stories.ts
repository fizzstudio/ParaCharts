import { Chart, type ChartProps } from '../Chart';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { expect } from 'storybook/test';

import Runner from '../tests/steplineTests';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Basic Charts/Line Charts/Multi Stepline Charts",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const Chart11: Story = {
  name: "175: Distribution of gross domestic product (GDP) across economic sectors Pakistan 2018 (11)",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-175.json",
    forcecharttype: "stepline",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/autogen/line-multi/line-multi-manifest-175.json");
    await runner.run();
  }
}
