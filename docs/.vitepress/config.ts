import { defineConfig } from 'vitepress'
import { defaultConfig } from '../../lib/config/config_defaults.js'

const configLabels: Record<string, string> = {
  axis: 'Axes',
  controlPanel: 'Control Panel',
  description: 'Descriptions',
  popup: 'Popups',
  ui: 'UI'
}

const displayName = (name: string) => configLabels[name]
  ?? name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, first => first.toUpperCase())

const configCategoryItems = Object.keys(defaultConfig)
  .filter(name => name !== 'type')
  .map(name => ({ text: displayName(name), link: `/config/${name}` }))

const chartTypeItems = Object.keys(defaultConfig.type)
  .map(name => ({ text: displayName(name), link: `/config/type/${name}` }))

export default defineConfig({
  base: '/ParaCharts/',
  title: 'ParaCharts',
  description: 'ParaCharts user and developer documentation',
  themeConfig: {
    logo: '/fizz-logo.svg',
    nav: [
      { text: 'Docs', link: '/index' },
      { text: 'API', link: '/api/' }
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
            {
              text: 'Configuration',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/config' },
                { text: 'Defining Settings', link: '/config/descriptors' },
                { text: 'Chart-Type Defaults', link: '/config/chart-type-defaults' },
                ...configCategoryItems,
                {
                  text: 'Chart Types',
                  link: '/config/type',
                  collapsed: true,
                  items: chartTypeItems
                }
              ]
            },
            { text: 'ParaAPI', link: '/paraapi' },
            { text: 'API Reference', link: '/api/' }
          ]
        }
      ]
    }
  }
})
