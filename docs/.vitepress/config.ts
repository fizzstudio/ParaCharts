import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ParaCharts',
  description: 'ParaCharts user and developer documentation',
  themeConfig: {
    logo: '/fizz-logo.svg',
    nav: [
      { text: 'Docs', link: '/index' },
      { text: 'API', link: '/chartTypes' }
    ],
    sidebar: {
      '/': [
        {
          text: 'Overview',
          items: [
            { text: 'Introduction', link: '/index' }
          ]
        },
        {
          text: 'Core Features',
          items: [
            { text: 'Chart Types', link: '/chartTypes' },
            { text: 'Control Panel', link: '/controlPanel' }
          ]
        },
        {
          text: 'User Experience',
          items: [
            { text: 'Accessibility', link: '/accessibility' },
            { text: 'Shortcuts & Commands', link: '/shortcutsAndCommands' }
          ]
        }
      ]
    }
  }
})
