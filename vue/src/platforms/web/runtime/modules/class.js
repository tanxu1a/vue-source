/* @flow */

import {
  isDef,
  isUndef
} from 'shared/util'

import {
  concat,
  stringifyClass,
  genClassForVnode
} from 'web/util/index'

function updateClass (oldVnode: any, vnode: any) {
  // 拿到真实的dom
  const el = vnode.elm
  const data: VNodeData = vnode.data
  const oldData: VNodeData = oldVnode.data
  if (
    isUndef(data.staticClass) &&
    isUndef(data.class) && (
      isUndef(oldData) || (
        isUndef(oldData.staticClass) &&
        isUndef(oldData.class)
      )
    )
  ) {
    return
  }

  // 生成样式
  let cls = genClassForVnode(vnode)

  // handle transition classes
  const transitionClass = el._transitionClasses
  if (isDef(transitionClass)) {
    cls = concat(cls, stringifyClass(transitionClass))
  }

  // 重新设置样式
  // set the class
  if (cls !== el._prevClass) {
    el.setAttribute('class', cls)
    el._prevClass = cls
  }
}

export default {
  create: updateClass,
  update: updateClass
}
