/**
 * Not type-checking this file because it's mostly vendor code.
 */

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson (MPL-1.1 OR Apache-2.0 OR GPL-2.0-or-later)
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

import { makeMap, no } from 'shared/util'
import { isNonPhrasingTag } from './../../platforms/web/compiler/util'
import { unicodeRegExp } from 'core/util/lang'

// Regular Expressions for parsing tags and attributes
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const doctype = /^<!DOCTYPE [^>]+>/i
// #7298: escape - to avoid being passed as HTML comment when inlined in page
const comment = /^<!\--/
const conditionalComment = /^<!\[/

// Special Elements (can contain anything)
export const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {}

const decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t',
  '&#39;': "'"
}
const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g

// #5992
const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'

function decodeAttr (value, shouldDecodeNewlines) {
  const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
  // 将匹配到的转换为 decodingMap中的值
  return value.replace(re, match => decodingMap[match])
}
// 解析html
export function parseHTML (html, options) {
  // 定义一个栈
  const stack = []
  // web环境是true
  const expectHTML = options.expectHTML
  // 无内容的标签 如<link href=xxx></link>
  const isUnaryTag = options.isUnaryTag || no
  // 可以不闭合的标签
  // 例如：
  //   <table>
  //   <thead>
  //   <tr>
  //   <th scope="col">Income
  //   <th scope="col">Taxes
  //   <tbody>
  //   <tr>
  //   <td>$ 5.00
  // <td>$ 4.50
  // </table>
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no
  let index = 0
  let last, lastTag
  // 当html字符串不为空
  while (html) {
    // 保存上一次处理的html字符串
    last = html
    // Make sure we're not in a plaintext content element like script/style
    // 确保父级标签不是 script,style,textarea
    // 如果上一次处理的标签不是 script,style,textarea
    if (!lastTag || !isPlainTextElement(lastTag)) {
      // 第一个 '<' 的位置
      let textEnd = html.indexOf('<')
      // 第一个字符是 '<'
      if (textEnd === 0) {
        // Comment:
        // 处理注释
        if (comment.test(html)) {
          // 拿到注释结尾的下标
          const commentEnd = html.indexOf('-->')

          if (commentEnd >= 0) {
            if (options.shouldKeepComment) {
              // 调用传进来的comment处理方法
              options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3)
            }
            // advanc方法就是截取字符串，html.substring(n)
            advance(commentEnd + 3)
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        // 如果以<![ 开头    啥也没做，直接略过了
        if (conditionalComment.test(html)) {
          const conditionalEnd = html.indexOf(']>')

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2)
            continue
          }
        }

        // Doctype:
        // 如果匹配到有文档类型相关的字符串  同样滤过
        const doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          advance(doctypeMatch[0].length)
          continue
        }

        // End tag:
        // 如果遇到结束标签
        const endTagMatch = html.match(endTag)
        if (endTagMatch) {
          const curIndex = index
          // 截取掉结束标签
          advance(endTagMatch[0].length)
          // 处理结束标签
          parseEndTag(endTagMatch[1], curIndex, index)
          continue
        }

        // Start tag:
        // 匹配开始标签   匹配的属性都保存在对象的attrs中
        const startTagMatch = parseStartTag()
        if (startTagMatch) {
          // 处理起始标签
          // 主要逻辑是处理attrs，并调用options.start方法
          handleStartTag(startTagMatch)
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1)
          }
          continue
        }
      }

      let text, rest, next
      // 如果首个字符不是'<',  即起始和结束标签中的文本
      if (textEnd >= 0) {
        // 截取到从下一个'<' 到结束
        rest = html.slice(textEnd)
        // 如果没有匹配到结束标签注释，开始标签，注释，文档类型声明
        // 说明'<'是 文本节点中的，并非标签的'<'
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          // 如果之后没有'<'了，退出循环
          // 否则继续往后找
          next = rest.indexOf('<', 1)
          if (next < 0) break
          textEnd += next
          rest = html.slice(textEnd)
        }
        // 此时拿到的就是标签之间的文本
        text = html.substring(0, textEnd)
      }

      // 如果没有'<'字符，那么就是一个纯文本了，没有标签
      if (textEnd < 0) {
        text = html
      }

      if (text) {
        advance(text.length)
      }

      if (options.chars && text) {
        // 调用chars方法处理文本节点，生成对应的ast
        options.chars(text, index - text.length, index)
      }
    } else {
      // 如果上一次处理的标签是 script,style,textarea
      // 以下逻辑主要是在处理 script,style,textarea中的文本内容
      let endTagLength = 0
      const stackedTag = lastTag.toLowerCase()
      const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      const rest = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
        }
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1)
        }
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      index += html.length - rest.length
      html = rest
      // 处理结束标签
      parseEndTag(stackedTag, index - endTagLength, index)
    }

    // 如果下一次的html和上一次的相等
    if (html === last) {
      // 那么直接调用chars方法把剩余的剩余的html字符串当作文本处理
      options.chars && options.chars(html)
      if (process.env.NODE_ENV !== 'production' && !stack.length && options.warn) {
        options.warn(`Mal-formatted tag at end of template: "${html}"`, { start: index + html.length })
      }
      // 退出while循环
      break
    }
  }

  // Clean up any remaining tags
  // 清空stack，stack保存了起始标签生成的ast
  parseEndTag()

  // 去掉字符串前面n个字符
  function advance (n) {
    index += n
    html = html.substring(n)
  }

  function parseStartTag () {
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
        start: index
      }
      advance(start[0].length)
      let end, attr
      while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
        attr.start = index
        advance(attr[0].length)
        attr.end = index
        match.attrs.push(attr)
      }
      if (end) {
        match.unarySlash = end[1]
        advance(end[0].length)
        match.end = index
        return match
      }
    }
  }

  // 处理开始标签 主要是在处理 attrs， 调用options.start方法
  function handleStartTag (match) {
    // 获得标签名称
    const tagName = match.tagName
    const unarySlash = match.unarySlash

    if (expectHTML) {
      // 如果上一个标签是P标签 并且当前标签是容器标签
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      // 如果是非闭合标签，并且上一个标签名称与当前相同
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName)
      }
    }

    // 无内容标签标签
    const unary = isUnaryTag(tagName) || !!unarySlash

    const l = match.attrs.length
    const attrs = new Array(l)
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i]
      const value = args[3] || args[4] || args[5] || ''
      // 是否解析换行符，默认都是转换了的
      const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines
      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewlines)
      }
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        attrs[i].start = args.start + args[0].match(/^\s*/).length
        attrs[i].end = args.end
      }
    }

    // 如果不是可不闭合标签
    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end })
      lastTag = tagName
    }

    // 调用传入的start方法
    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end)
    }
  }

  // 解析闭合标签， 调用options.end方法
  function parseEndTag (tagName, start, end) {
    let pos, lowerCasedTagName
    if (start == null) start = index
    if (end == null) end = index

    // Find the closest opened tag of the same type
    // 在stack中找开始标签
    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase()
      // 从栈顶开始找，找到与结束标签匹配的开始标签的位置，赋给pos
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // 如果没有传tagName参数，pos=0，之后会执行stack.length = 0，即清空stack
      // If no tag name is provided, clean shop
      pos = 0
    }

    // 如果找到对应的起始标签
    if (pos >= 0) {
      // Close all the open elements, up the stack
      // 遍历栈 从 栈顶-> pos
      // 调用options.end闭合标签，因为有些标签可以没有闭合标签，
      // 所以与闭合标签匹配的之间可以有多个起始标签
      for (let i = stack.length - 1; i >= pos; i--) {
        if (process.env.NODE_ENV !== 'production' &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(
            `tag <${stack[i].tag}> has no matching end tag.`,
            { start: stack[i].start, end: stack[i].end }
          )
        }
        if (options.end) {
          // 调用传入的end方法
          options.end(stack[i].tag, start, end)
        }
      }

      // Remove the open elements from the stack
      // 缩减栈长度，移除已经执行过闭合了的元素
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
    }
    else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end)
      }
    }
    else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }
  }
}
