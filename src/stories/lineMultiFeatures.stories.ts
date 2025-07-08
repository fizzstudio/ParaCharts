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

export const FeaturesChart0: Story = {
  name: "Multi-series Line Chart with Legend and No Symbols",
  args: {
    filename: "manifests/autogen/line-multi/line-multi-manifest-16.json",
    forcecharttype: "line",
    config: {
      'chart.hasDirectLabels': false,
      'chart.isDrawSymbols': false,
      'legend.isAlwaysDrawLegend': true
    }
  }
}
