/* @flow */
// 引入config文件
import config from '../../core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'
// 引入Vue
import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

// 返回缓存过了的函数结果
const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

// 这个其实是runtime中的$mount方法
const mount = Vue.prototype.$mount
// 覆盖了runtime中的$mount方法
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // 获得element
  el = el && query(el)

  /* istanbul ignore if */
  // 如果el是body，或者是document，报警告
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  // 拿到options参数
  const options = this.$options
  // resolve template/el and convert to render function
  // 如果不是render函数
  if (!options.render) {
    // 拿到options.template属性的值
    let template = options.template
    // 如果设置了template属性
    if (template) {
      // 如果是字符串
      if (typeof template === 'string') {
        // 如果第一个字符是#
        if (template.charAt(0) === '#') {
          // 选取到节点
          template = idToTemplate(template)
          /* istanbul ignore if */
          // 选取不到，报警告
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
        // 否则如果template是节点对象
      } else if (template.nodeType) {
        // 拿子节点
        template = template.innerHTML
      } else {
        // 否则报警告
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 否则去拿到el的子节点
      template = getOuterHTML(el)
    }
    if (template) {
      // 性能埋点
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      // 将模板编译为render函数
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        // 改变纯文本插入分隔符 默认是  ["{{", "}}"]  如果改成 ['${', '}']  那么模板上就可以用 ${}去包裹数据了
        delimiters: options.delimiters,
        // 当设为 true 时，将会保留且渲染模板中的 HTML 注释。默认行为是舍弃它们。
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      // 性能埋点
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  // 执行untime中的$mount方法
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
// 拿子节点内容
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
