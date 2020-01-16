import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from './../core/util/env'
import { FunctionalRenderContext } from './../core/vdom/create-functional-component'

// 初始化全局api
initGlobalAPI(Vue)

// 定义是否正在服务端渲染
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

// 服务端渲染上下文是否已存在
Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})
// 定义版本，编译替换
Vue.version = '__VERSION__'

export default Vue
