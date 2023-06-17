import { createI18n } from 'vue-i18n'
import langs from './index.ts'

//console.log(localStorage)

const i18n=createI18n({
    fallbackLocale: 'zh',
    globalInjection: true,
    locale: localStorage.lang || navigator.language,
    messages: langs,
    legacy: false
})

export default i18n