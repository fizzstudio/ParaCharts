import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ParaCharts',
  description: 'ParaCharts user and developer documentation',
  themeConfig: {
    logo: '/fizz-logo.svg',
    nav: [
      { text: 'Docs', link: '/index.md' },
      { text: 'API', link: '/api-reference.md' }
    ]
  }
})
