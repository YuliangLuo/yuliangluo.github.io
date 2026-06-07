import { defineConfig } from 'vitepress'

const githubRepo = process.env.GITHUB_REPOSITORY || ''
const repoName = githubRepo.split('/')[1] || ''
const owner = githubRepo.split('/')[0] || 'yuliangluo'
const isUserSite = repoName === `${owner}.github.io`

// User site: https://yuliangluo.github.io/ -> base = '/'
// Project site: https://yuliangluo.github.io/<repo>/ -> base = '/<repo>/'
const base = process.env.BASE_PATH || (process.env.GITHUB_ACTIONS && !isUserSite && repoName ? `/${repoName}/` : '/')

export default defineConfig({
  title: 'Yuliang Luo',
  description: 'Technical blog',
  base: '/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  head: [
    ['meta', { name: 'theme-color', content: '#111827' }],
    ['meta', { name: 'author', content: 'Yuliang Luo' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Yuliang Luo 技术博客' }],
    ['meta', { property: 'og:description', content: 'White-box Test Agent / Backpropagation / 2026 Agent Engineering Notes' }]
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Yuliang Tech Blog',
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' },
      { text: '关于', link: '/about' }
    ],
    sidebar: {
      '/posts/': [
        {
          text: '文章索引',
          items: [
            { text: '全部文章', link: '/posts/' }
          ]
        },
        {
          text: '技术文章',
          items: [
            { text: '白盒测试 Agent：从规则脚本到领域智能体', link: '/posts/whitebox-test-agent' },
            { text: '反向传播的理解：从链式法则到最小自动微分', link: '/posts/backpropagation-understanding' },
            { text: '2026 Agent 趋势：从 Demo 到可验证工程系统', link: '/posts/agent-trends-2026' },
            { text: 'MicroGrad_MLP_Training', link: '/posts/micrograd_mlp_training '}
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yuliangluo' }
    ],
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Built with VitePress and GitHub Pages.',
      copyright: 'Copyright © 2026 Yuliang Luo'
    }
  },
  markdown: {
    lineNumbers: true
  }
})
