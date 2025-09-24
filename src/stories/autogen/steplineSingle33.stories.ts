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

export const Chart33: Story = {
  name: "843: New York Yankees revenue 2001 to 2018 (33)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-843.json",
    forcecharttype: "stepline",
  },
  play: async ({canvas, userEvent}) => {
    const runner = await (new Runner(canvas, userEvent, expect)).loadManifest("manifests/autogen/line-single/line-single-manifest-843.json");
    await runner.run();
  }
}
