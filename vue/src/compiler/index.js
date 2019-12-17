/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 将模板转换为抽象语法树
  const ast = parse(template.trim(), options)
  if (options.optimize !== false) {
    // 对ast做一些优化  主要是添加static标识，表示该节点是静态的，从第一次选然后就不会变的，如文本节点
    optimize(ast, options)
  }
  // 生成渲染函数字符串
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
