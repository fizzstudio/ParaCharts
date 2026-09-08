import { Chart, type ChartProps } from './Chart';

import type { Meta, StoryObj } from '@storybook/web-components';
import { expect } from 'storybook/test';

type Story = StoryObj<ChartProps>;

const meta = {
  title: 'Specialized Charts',
  render: (args) => Chart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const DescriptionOverride: Story = {
  args: {
    filename: 'manifests/autogen/line-single/line-single-manifest-843.json',
    description: 'Unrelated <span data-action=\"getSeries(\'Revenue in million U.S. dollars\').getPoints(0).highlight()\" data-phrasecode=\"0\">description</span><span data-action=\"getSeries(\'Revenue in million U.S. dollars\').getPoints(1).highlight()\" data-phrasecode="1">.</span>'
  },
  play: async ({ canvas, userEvent }) => {
    const parachart = await canvas.findByTestId('para-chart');
    await expect(parachart).toBeInTheDocument();
  },
}
