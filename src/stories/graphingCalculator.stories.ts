import { Settings } from '../../lib/store/settings_types';
import { defaults } from '../../lib/store/settings_defaults';
import { Chart, type ChartProps } from './Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Chart",
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const GraphingCalculator0: Story = {
  name: "Graphing Calculator",
  args: {
    filename: "",
    //@ts-ignore
    forcecharttype: "graph",
    config: {
    }
  }
}