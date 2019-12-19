/* @flow */

import { ASSET_TYPES } from '../../shared/constants'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'


export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   *  基于Vue构建一个新的Vue对象
   */
  Vue.extend = function (extendOptions: Object): Function {
    // 待合并扩展的options
    extendOptions = extendOptions || {}
    // 保存自身实例
    const Super = this
    // 取得自身实例的cid
    const SuperId = Super.cid
    // 做了一波缓存操作，如果同一待扩展对象多次用调用同一个Vue实例的extend方法，
    // 那么直接从_Ctor中获取
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    // 做了一波名称合法校验
    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }

    // 定义子构造器，以下操作实现了一波原型继承
    const Sub = function VueComponent (options) {
      // 子构造器调用父类构造方法
      this._init(options)
    }
    // 给子类原型赋值，这里有个问题就是constructor还是指向Super啊
    Sub.prototype = Object.create(Super.prototype)
    // 所以这里给重新指向了一波constructor
    Sub.prototype.constructor = Sub
    // cid++
    Sub.cid = cid++
    // 合并options
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    // 子类的super属性指向父类
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // 缓存
    // cache constructor
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

function initProps (Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
