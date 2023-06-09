import { createApp } from 'vue'
import i18n from './languages/i18n.ts'
import App from './App.vue'

import './style.css'
import './main.css'

const app = createApp(App)
app.use(i18n).mount("#app")

// import ElementPlus from 'element-plus'
// import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// app.use(ElementPlus, {
//   locale: zhCn,
// })

// import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component)
// }