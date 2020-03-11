/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  // 静态的实例，类似全局变量，当前正在计算的Watcher
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    // 依赖收集对象id
    this.id = uid++
    // 保存依赖于该数据的观察者Watcher
    this.subs = []
  }

  // 添加依赖该数据的观察者对象
  addSub (sub: Watcher) {
    this.subs.push(sub)

  }

  // 移除观察者
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  // 依赖收集
  depend () {
    // Dep.target指向当前正在渲染的组件的Watcher实例子
    if (Dep.target) {
      // this指向dep的实例
      Dep.target.addDep(this)
    }
  }

  // 通知观察者触发更新
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      // 调用Watcher.update方法
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
