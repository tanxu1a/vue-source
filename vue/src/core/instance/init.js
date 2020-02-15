/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  // 初始化函数
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    // 一个自增的uid
    vm._uid = uid++

    // 性能埋点相关
    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // 一个标志，防止这个对象成为响应式对象
    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    // 如果是组件的话
    // 第一次new Vue调用了 this._init()方法，再次之前并未给_isComponent赋值，
    // 所以new Vue()之后调用的init方法会走到else去
    // 如果是组件的话，那么就初始化组件的options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 初始化内部组件
      initInternalComponent(vm, options)
      // 如果不是组件
    } else {
      // 合并options属性
      vm.$options = mergeOptions(
        // 获得当前构造器的options属性
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    // 如果是非生产环境，添加一些代理，has 或者  get方法的代理
    // 主要用于检查属性是否存在，是否合法
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    // vue的实例的_self等于这个vue实例
    vm._self = vm
    // 此方法主要初始化一些Vue实例(或子组件实例)的一些属性
    initLifecycle(vm)
    // 初始化事件
    initEvents(vm)
    // 主要定义vm._c 和 vm.$createElement 方法，作用是执行render函数生成vnode
    initRender(vm)
    // 执行beforeCreate声明周期钩子
    callHook(vm, 'beforeCreate')
    // 初始化inject
    initInjections(vm) // resolve injections before data/props
    // 初始化
    initState(vm)
    // 初始化provide
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  // 获取组件的options
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  // 获得父vnode的组件options
  const vnodeComponentOptions = parentVnode.componentOptions
  // 赋值组件参数
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  //
  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

// 解析构造器上的options
// 返回当前构造器最新的options属性
export function resolveConstructorOptions (Ctor: Class<Component>) {
  // 获得构造器上的options，此options是在initGlobalAPI方法中定义的，Vue.options=xxx
  let options = Ctor.options
  // 如果当前组件是Vue.extend()构造出来的，Ctor.super=true,递归求得父组件的options
  if (Ctor.super) {
    // 一直递归获得最原始的那个Vue构造器的options
    const superOptions = resolveConstructorOptions(Ctor.super)
    // 之后的步骤主要是为了父构造器的options变化了，那么用Vue.extend()构造出来的构造器的options也应该改变
    // Sub在创建定义的时候，赋值过一次options（详见Vue.extend实现）

    // 缓存的构造器options
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // 如果父构造器的options改变了
      // super option changed,
      // need to resolve new options.
      // 当前构造器的superOptions更新为新的
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
