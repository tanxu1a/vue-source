/* @flow */

// this.tag = tag // 当前节点标签名
// this.data = data // 当前节点数据（VNodeData类型）
// this.children = children // 当前节点子节点
// this.text = text // 当前节点文本
// this.elm = elm // 当前节点对应的真实DOM节点
// this.ns = undefined // 当前节点命名空间
// this.context = context // 当前节点上下文
// this.fnContext = undefined // 函数化组件上下文
// this.fnOptions = undefined // 函数化组件配置项
// this.fnScopeId = undefined // 函数化组件ScopeId
// this.key = data && data.key // 子节点key属性
// this.componentOptions = componentOptions // 组件配置项
// this.componentInstance = undefined // 组件实例
// this.parent = undefined // 当前节点父节点
// this.raw = false // 是否为原生HTML或只是普通文本
// this.isStatic = false // 静态节点标志 keep-alive
// this.isRootInsert = true // 是否作为根节点插入
// this.isComment = false // 是否为注释节点
// this.isCloned = false // 是否为克隆节点
// this.isOnce = false // 是否为v-once节点
// this.asyncFactory = asyncFactory // 异步工厂方法
// this.asyncMeta = undefined // 异步Meta
// this.isAsyncPlaceholder = false // 是否为异步占位

export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void;
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder?
  isCloned: boolean; // is a cloned node?
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  devtoolsMeta: ?Object; // used to store functional render context for devtools
  fnScopeId: ?string; // functional scope id support

  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    // 标签
    this.tag = tag
    // 数据，如attrs，事件等
    this.data = data
    // 子节点
    this.children = children
    // 文本
    this.text = text
    //
    this.elm = elm
    // 命名控件，如svg
    this.ns = undefined
    // 上下文，一般指Vue实例对象
    this.context = context
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = true
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child (): Component | void {
    return this.componentInstance
  }
}

export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}

export function createTextVNode (val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
export function cloneVNode (vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true
  return cloned
}
