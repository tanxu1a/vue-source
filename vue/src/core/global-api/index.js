/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from './../../shared/constants'
import builtInComponents from '../components/index'
import { observe } from './../../core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // 定义Vue.config对象
  const configDef = {}
  configDef.get = () => config
  // 非生产环境设置给  config整体赋值会提示警告
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  // 设置全局配置
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 设置vue工具函数，但这些工具函数并不是公共api，不建议外部使用
  Vue.util = {
    // 提示警告
    warn,
    // 合并扩展对象属性
    extend,
    // 合并两个options的方法
    mergeOptions,
    // 定义响应式属性的方法
    defineReactive
  }
  // 静态 set方法
  Vue.set = set
  // 静态 delete方法
  Vue.delete = del
  // 静态 nexttick方法
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

  // 初始化Vue的options属性(静态属性)
  Vue.options = Object.create(null)
  // 初始化'components','directives','filters'  属性
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  // _base标识Vue是所有组件的基础构造函数
  Vue.options._base = Vue

  // 初始化components属性，KeepAlive组件
  extend(Vue.options.components, builtInComponents)

  // 定义Vue.use方法
  initUse(Vue)
  // 定义Vue.minx方法
  initMixin(Vue)
  // 定义Vue.extend方法
  initExtend(Vue)
  // 定义Vue.component  Vue.directive  Vue.filter方法
  initAssetRegisters(Vue)
}
