import { AiChart, type ChartProps } from './Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: 'Chart',
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const DescriptionOverride: Story = {
  args: {
    filename: 'manifests/autogen/line-single/line-single-manifest-843.json',
    description: 'An unrelated description'
  }
}
