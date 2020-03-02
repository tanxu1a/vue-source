/* @flow */

import {
  warn,
  nextTick,
  emptyObject,
  handleError,
  defineReactive
} from '../util/index'

import { createElement } from '../vdom/create-element'
import { installRenderHelpers } from './render-helpers/index'
import { resolveSlots } from './render-helpers/resolve-slots'
import { normalizeScopedSlots } from '../vdom/helpers/normalize-scoped-slots'
import VNode, { createEmptyVNode } from '../vdom/vnode'

import { isUpdatingChildComponent } from './lifecycle'

// 初始化render相关属性和方法
export function initRender (vm: Component) {
  // 初始化_vnode属性
  vm._vnode = null // the root of the child tree
  // 初始化_staticTrees属性
  vm._staticTrees = null // v-once cached trees
  // 获取options
  const options = vm.$options
  // 获得父组件的占位vnode,其实也就是当前组件的vnode
  // 最外层的vm的options._parentVnode是undefined
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree
  // renderContext === 父组件实例
  const renderContext = parentVnode && parentVnode.context
  // options._renderChildren是写在组件插槽中的dom编译后生成的vnode
  // vm.$slots保存了组件插槽中dom对应的vnode
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  // 作用域插槽属性初始化
  vm.$scopedSlots = emptyObject
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  // 定义_c方法
  // 通过template编译生成的render函数会执行的_c方法
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  // 用户自定义会执行的render方法
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  const parentData = parentVnode && parentVnode.data

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
    }, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
}

export let currentRenderingInstance: Component | null = null

// for testing only
export function setCurrentRenderingInstance (vm: Component) {
  currentRenderingInstance = vm
}

export function renderMixin (Vue: Class<Component>) {
  // install runtime convenience helpers
  // 原型挂在一些render需要用到的转换方法
  installRenderHelpers(Vue.prototype)

  // 原型挂在$nextTick方法
  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick(fn, this)
  }

  // 挂在_render方法
  Vue.prototype._render = function (): VNode {
    const vm: Component = this
    // 拿到render函数和_parentVnode
    // _parentVnode就是类似 <comp1 prop1="123"></comp1>  转化而来的vnode，而非comp1组件内部的vnode，组件内部的vnode是vm._vnode
    // render函数可以是从模板编译来的也可以是用户自定义的render函数
    const { render, _parentVnode } = vm.$options

    // 如果是非根组件，因为根实例没有_parentVnode
    if (_parentVnode) {
      // 处理slot相关数据
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots,
        vm.$scopedSlots
      )
    }

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    // $vnode表示父节点的vnode
    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
      // There's no need to maintain a stack because all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      // 全局变量，当前正在渲染的Vue实例
      currentRenderingInstance = vm
      // 执行render函数，参数是 $createElement方法，this = vm
      // 如果是用户自定义render函数，那么会调用render(vm.$createElement)
      // 如果是从模板编译来的，都是调用vm._c()
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      handleError(e, vm, `render`)
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
        } catch (e) {
          handleError(e, vm, `renderError`)
          vnode = vm._vnode
        }
      } else {
        vnode = vm._vnode
      }
    } finally {
      currentRenderingInstance = null
    }
    // if the returned array contains only a single node, allow it
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0]
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = createEmptyVNode()
    }
    // set parent
    vnode.parent = _parentVnode
    return vnode
  }
}
