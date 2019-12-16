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
  // 用来检测一个属性在标签中是否要使用元素对象原生的 prop 进行绑定
  mustUseProp,
  // 可无结束标签
  canBeLeftOpenTag,
  // 是原生标签，非自定义
  isReservedTag,
  // 获得标签命名空间，即判断是svg相关标签   还是  math相关标签
  getTagNamespace,
  staticKeys: genStaticKeys(modules)
}
