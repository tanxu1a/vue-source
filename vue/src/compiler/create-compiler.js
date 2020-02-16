/* @flow */

import { extend } from 'shared/util'
import { detectErrors } from './error-detector'
import { createCompileToFunctionFn } from './to-function'
// 这里使用了函数柯里化的技巧将baseCompile基础编译过程 和 baseOptions平台相关的基础配置分别传入，
// 以达到不同平台(web,weex,ssr)可以传入不同的baseOptions以达到不同的编译效果

// Vue.js 在不同的平台下都会有编译的过程，因此编译过程中的依赖的配置 baseOptions 会有所不同。
// 而编译过程会多次执行，但这同一个平台下每一次的编译过程配置又是相同的，
// 为了不让这些配置在每次编译过程都通过参数传入，
// baseOptions变量会以闭包的方式保存在作用域内不得释放以达到参数复用的目的
// Vue.js 利用了函数柯里化的技巧很好的实现了 baseOptions 的参数保留。
// 同样，Vue.js 也是利用函数柯里化技巧把基础的编译过程函数抽出来，
// 通过 createCompilerCreator(baseCompile) 的方式把真正编译的过程和其它逻辑如对编译配置处理、缓存处理等剥离开，这样的设计还是非常巧妙的。
export function createCompilerCreator (baseCompile: Function): Function {
  return function createCompiler (baseOptions: CompilerOptions) {
    function compile (
      template: string,
      options?: CompilerOptions
    ): CompiledResult
    {
      // baseOptions
      const finalOptions = Object.create(baseOptions)
      // 错误
      const errors = []
      // 提示
      const tips = []

      let warn = (msg, range, tip) => {
        (tip ? tips : errors).push(msg)
      }

      // options传了的话，合并
      if (options) {
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          // $flow-disable-line
          const leadingSpaceLength = template.match(/^\s*/)[0].length

          warn = (msg, range, tip) => {
            const data: WarningMessage = { msg }
            if (range) {
              if (range.start != null) {
                data.start = range.start + leadingSpaceLength
              }
              if (range.end != null) {
                data.end = range.end + leadingSpaceLength
              }
            }
            (tip ? tips : errors).push(data)
          }
        }
        // merge custom modules
        // 合并modules，将传入的options的modules和baseOptions的modules合并
        if (options.modules) {
          // 合并自定义的 options.modules
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules)
        }
        // merge custom directives
        // 合并自定义的指令
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          )
        }
        // copy other options
        // 合并其他属性
        for (const key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key]
          }
        }
      }

      finalOptions.warn = warn

      // 调用编译函数生成ast和render函数
      // return {
      //     ast,
      //     render: code.render,
      //     staticRenderFns: code.staticRenderFns
      //   }
      const compiled = baseCompile(template.trim(), finalOptions)
      if (process.env.NODE_ENV !== 'production') {
        detectErrors(compiled.ast, warn)
      }
      compiled.errors = errors
      compiled.tips = tips
      return compiled
    }

    return {
      compile,
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}
