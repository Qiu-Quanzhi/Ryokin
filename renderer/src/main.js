import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './main.css'

const app = createApp(App)
app.mount("#app")

// import ElementPlus from 'element-plus'
// import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// app.use(ElementPlus, {
//   locale: zhCn,
// })

// import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component)
// }