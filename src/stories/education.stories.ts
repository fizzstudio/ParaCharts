import { AiChart, type ChartProps } from './Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "Education",
  render: (args) => AiChart(args),
} satisfies Meta<ChartProps>;

export default meta;

export const EduChart1: Story = {
  name: "1. New York Yankees revenue 2001 to 2018 (843)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-843.json",
  }
}

export const EduChart2: Story = {
  name: "2. Inflation rate in EU and Euro area 2024 (76)",
  args: {
    filename: 'manifests/autogen/line-multi/line-multi-manifest-76.json'
  }
}

export const EduChart3: Story = {
  name: "3. Distribution of GDP across economic sectors in China 2008 to 2018 (57)",
  args: {
    filename: 'manifests/autogen/line-multi/line-multi-manifest-57.json'
  }
}

export const EduChart4: Story = {
  name: "4. Global construction machinery market size by region: outlook 2019 (178)",
  args: {
    filename: 'manifests/autogen/bar-multi/bar-multi-manifest-178.json',
  }
}

export const EduChart5: Story = {
  name: "5. Division of energy in the Universe (47)",
  args: {
    filename: 'manifests/pie-manifest-dark-matter.json'
  }
}

export const EduChart6: Story = {
  name: "6. Old Faithful Geyser Eruptions (51)",
  args: {
    filename: 'manifests/scatter-manifest-geyser.json'
  }
}
