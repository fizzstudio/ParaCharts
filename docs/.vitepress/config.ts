import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/paracharts-docs/',
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
          text: 'User Guide',
          items: [
            { text: 'Chart Types', link: '/chartTypes' },
            { text: 'Control Panel', link: '/controlPanel' },
             { text: 'Accessibility', link: '/accessibility' },
            { text: 'Shortcuts & Commands', link: '/shortcutsAndCommands' }
          ]
        },
        {
          text: 'Developer Guide',
          items: [
            { text: 'Custom Elements', link: '/customElements' },
            { text: 'Manifest', link: '/manifest' },
            { text: 'Settings Object', link: '/settingsObj' }
          ]
        }
      ]
    }
  }
})
