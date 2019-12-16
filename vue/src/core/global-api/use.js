/* @flow */

import { toArray } from '../util/index'

// 这个方法主要把Vue引用通过install(Vue)方法暴露出去，
// 当调用Vue.use(Plugin)时，会执行Plugin.install(Vue)
// 这样实现isntall方法的Plugin就可以对Vue进行任何操作，
// 以达到对Vue扩展的目的
export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 如果没有_installedPlugins属性，创建一个空数组
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    // 如果插件已存在，直接返回
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    // 将参数（类数组对象）从第二个参数开始转化为数组
    const args = toArray(arguments, 1)
    // 第一个参数就是this 即Vue
    args.unshift(this)
    // 如果plugin.install是个函数，就调用 isntall(args)
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
      // 如果plugin直接是个函数，那就直接调用
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
