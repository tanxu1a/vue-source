/* @flow */

import {
  isPreTag,
  mustUseProp,
  isReservedTag,
  getTagNamespace
} from '../util/index'

import modules from './modules/index'
import directives from './directives/index'
import { genStaticKeys } from 'shared/util'
import { isUnaryTag, canBeLeftOpenTag } from './util'

export const baseOptions: CompilerOptions = {
  expectHTML: true,
  modules,
  directives,
  // 是否是pre标签
  isPreTag,
  // 没有内容的标签
  isUnaryTag,
  // 判断那些标签的属性将被保存至ast对象的el.props属性中
  mustUseProp,
  // 可无结束标签
  canBeLeftOpenTag,
  // 是原生标签，非自定义
  isReservedTag,
  // 获得标签命名空间，即判断是svg相关标签   还是  math相关标签
  getTagNamespace,
  staticKeys: genStaticKeys(modules)
}
