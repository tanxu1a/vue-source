/* @flow */

import Vue from 'core/index'
import config from 'core/config'
import { extend, noop } from 'shared/util'
import { mountComponent } from '../../../core/instance/lifecycle'
import { devtools, inBrowser } from 'core/util/index'

import {
  query,
  mustUseProp,
  isReservedTag,
  isReservedAttr,
  getTagNamespace,
  isUnknownElement
} from '../../web/util/index'

import { patch } from './patch'
import platformDirectives from './directives/index'
import    from './components/index'

// install platform specific utils
// 给config设置了一些方法
// todo
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// 添加默认指令和组件
// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)

// install platform patch function
// todo
Vue.prototype.__patch__ = inBrowser ? patch : noop

// public mount method
//
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

// devtools global hook
/* istanbul ignore next */
// 如果是再浏览器端的话，提示一些信息，让你下载devtools啦，并告诉你这是开发环境

if (inBrowser) {
  setTimeout(() => {
    if (config.devtools) {
      if (devtools) {
        devtools.emit('init', Vue)
      } else if (
        process.env.NODE_ENV !== 'production' &&
        process.env.NODE_ENV !== 'test'
      ) {
        console[console.info ? 'info' : 'log'](
          'Download the Vue Devtools extension for a better development experience:\n' +
          'https://github.com/vuejs/vue-devtools'
        )
      }
    }
    if (process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test' &&
      config.productionTip !== false &&
      typeof console !== 'undefined'
    ) {
      console[console.info ? 'info' : 'log'](
        `You are running Vue in development mode.\n` +
        `Make sure to turn on production mode when deploying for production.\n` +
        `See more tips at https://vuejs.org/guide/deployment.html`
      )
    }
  }, 0)
}

export default Vue
