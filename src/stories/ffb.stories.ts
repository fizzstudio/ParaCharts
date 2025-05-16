import { Chart, type ChartProps } from './Chart';

import type { Meta, StoryObj } from '@storybook/web-components';

type Story = StoryObj<ChartProps>;

const meta = {
  title: "FFB",
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
  name: "1. Page 4-1",
  args: {
    filename: "/src/stories/ffb-page-4-1.json",
  }
}

export const DemoChart2: Story = {
  name: "2. Page 4-2",
  args: {
    filename: '/src/stories/ffb-page-4-2.json'
  }
}

export const DemoChart3: Story = {
  name: "3. Page 6-1",
  args: {
    filename: '/src/stories/ffb-page-6-1.json'
  }
}

export const DemoChart4: Story = {
  name: "4. Page 6-2",
  args: {
    filename: '/src/stories/ffb-page-6-2.json'
  }
}

export const DemoChart5: Story = {
  name: "5. Page 11",
  args: {
    filename: '/src/stories/ffb-page-11.json'
  }
}

export const DemoChart6: Story = {
  name: "6. Page 12",
  args: {
    filename: '/src/stories/ffb-page-12.json'
  }
}

export const DemoChart7: Story = {
  name: "7. Page 14",
  args: {
    filename: '/src/stories/ffb-page-14.json'
  }
}

export const DemoChart8: Story = {
  name: "7. Page 15-1",
  args: {
    filename: '/src/stories/ffb-page-15-1.json'
  }
}

export const DemoChart9: Story = {
  name: "7. Page 15-2",
  args: {
    filename: '/src/stories/ffb-page-15-2.json'
  }
}
