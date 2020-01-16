import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

// 定义初始化相关方法
initMixin(Vue)
// 定义状态相关方法
stateMixin(Vue)
// 事件相关
// $on，$off，$once方法
eventsMixin(Vue)
// 生命周期相关
lifecycleMixin(Vue)
// 实现$nextTick 与 _render方法
renderMixin(Vue)

export default Vue
