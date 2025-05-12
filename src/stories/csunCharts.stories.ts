import { Chart, type ChartProps } from './Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "CSUN",
  render: (args) => Chart(args),
  argTypes: {
    legendOrder: {
      description: 'Legend item order',
      control: {type: 'select'},
      options: ['lexical', 'chart']
    },
  },
} satisfies Meta<ChartProps>;

export default meta;

export const DemoChart1: Story = {
  name: "1. New York Yankees revenue 2001 to 2018 (843)",
  args: {
    filename: "manifests/autogen/line-single/line-single-manifest-843.json",
  }
}

export const DemoChart2: Story = {
  name: "2. Median household income in the United States 1990 to 2018 (172)",
  args: {
    filename: 'manifests/autogen/line-single/line-single-manifest-172.json'
  }
}

export const DemoChart3: Story = {
  name: "3. Gross domestic product (GDP) growth in EU and Euro area 2024 (128)",
  args: {
    filename: 'manifests/autogen/line-multi/line-multi-manifest-128.json'
  }
}

export const DemoChart4: Story = {
  name: "4. Distribution of the workforce across economic sectors in India 2019 (16)",
  args: {
    filename: 'manifests/autogen/line-multi/line-multi-manifest-16.json'
  }
}

export const DemoChart5: Story = {
  name: "5. Distribution of GDP across economic sectors in China 2008 to 2018 (57)",
  args: {
    filename: 'manifests/autogen/line-multi/line-multi-manifest-57.json'
  }
}

export const DemoChart6: Story = {
  name: "6. Advertising spending in Vietnam 2004-2018, by medium (233)",
  args: {
    filename: 'manifests/autogen/line-multi/line-multi-manifest-233.json'
  }
}

export const DemoChart7: Story = {
  name: "7. Gross domestic product of the ASEAN countries from 2008 to 2018 (48)",
  args: {
    filename: 'manifests/autogen/bar-multi/bar-multi-manifest-48.json',
    legendOrder: "chart"
  }
}
