import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "涼槿 Ryokin",
  description: "一只简明主义的浏览器",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
      { text: '下载站点', items: [
        { text: 'Github Release', link: 'https://github.com/Qiu-Quanzhi/Ryokin/releases/' },
        { text: '微云', link: 'https://share.weiyun.com/3y8qIZJe' }
      ] }
    ],

    sidebar: [
      {
        text: '下载站点',
        items: [
          { text: 'Github Release', link: 'https://github.com/Qiu-Quanzhi/Ryokin/releases/' },
          { text: '微云', link: 'https://share.weiyun.com/3y8qIZJe' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Qiu-Quanzhi/Ryokin' }
    ]
  }
})
