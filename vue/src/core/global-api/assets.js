/* @flow */

import { ASSET_TYPES } from './../../shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  // 遍历[
  //   'component',
  //   'directive',
  //   'filter'
  // ]
  // component 获得或注册全局组件
  // directive  获得或注册全局指令
  // filter 注册或获取全局过滤器
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      // 如果第二个参数为空，返回 components[id] 或 directive[id] ...
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        // 如果是非生产环境，调用component方法的话，校验id是否是合法名称
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          // Vue.extend
          definition = this.options._base.extend(definition)
        }
        // 如果是指令
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        // 将definition赋值到  components 等
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
