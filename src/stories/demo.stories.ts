import { AiChart, type ChartProps } from './Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Demos",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const DemoChart1: Story = {
  name: "1. Simple rising trend (sonification)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-843.json",
  }
}

export const DemoChart2: Story = {
  name: "2. Rebound trend",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-172.json",
  }
}

export const DemoChart3: Story = {
  name: "3. Tracking trends",
  args: {
    filename: 'manifests/autogen/line-multi/line-multi-manifest-128.json'
  }
}

export const DemoChart4: Story = {
  name: "4. Intersections",
  args: {
    filename: 'manifests/autogen/line-multi/line-multi-manifest-57.json'
  }
}

export const DemoChart5: Story = {
  name: "5. Pastry (simple caption, colors, patterns)",
  args: {
    filename: 'manifests/pie-manifest-dark-matter.json'
  }
}

export const DemoChart6: Story = {
  name: "6. Multiseries line (symbols, direct labels, low-vision, queries, annotations)",
  args: {
    filename: 'manifests/autogen/line-multi/line-multi-manifest-261.json'
  }
}


export const DemoChart7: Story = {
  name: "7. Stacked bar (interactive legend)",
  args: {
    filename: 'manifests/autogen/bar-multi/bar-multi-manifest-48.json',
    config: {
      'type.column.isDrawTotalLabels': false
    }
  }
}

export const DemoChart8: Story = {
  name: "8. Scatterplot clusters",
  args: {
    filename: 'manifests/scatter-manifest-geyser.json'
  }
}


export const DemoChart9: Story = {
  name: "9. Narrative highlights",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-172.json",
  }
}
