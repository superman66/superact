import Component from './Component'

export function createElement(type, props, ...args) {
  let children = args.length ? [].concat(...args) : []
  return { type, props: props || {}, children }
}

export const render = (vdom, parent = null) => {
  const mount = parent ? el => parent.appendChild(el) : el => el

  if (typeof vdom === 'string' || typeof vdom === 'number') {
    return mount(document.createTextNode(vdom))
  } else if (typeof vdom === 'boolean' || typeof vdom === null) {
    return mount(document.createTextNode(''))
  }
  // Component 类型
  else if (typeof vdom === 'object' && vdom.type === 'function') {
    return Component.render(vdom, parent)
  }
  // 普通 DOM 节点
  else if (typeof vdom === 'object' && vdom.type === 'string') {
    const dom = mount(document.createElement(vdom.type))
    vdom.children.forEach(child => render(child, dom))
  }
}

function setProps(vdom, props) {
  Object.keys(props).forEach(prop => this.setProp(vdom, prop, props[prop]))
}

function setProp(dom, key, value) {
  // 处理以 onXXX 开头的事件属性
  if (typeof value === 'function' && key.startsWith('on')) {
    const eventType = key.slice(2).toLowerCase()
    dom.__superactHandlers = dom.__superactHandlers || {}
    dom.removeEventListener(eventType, dom.__superactHandlers[eventType])
    dom.__superactHandlers[eventType] = value
    dom.addEventListener(eventType, dom.__superactHandlers[eventType])
  } else if (key === 'checked' || key === 'value' || key === 'className') {
    dom[key] = value
  } else if (key === 'key') {
    dom.__superactKey = value
  } else if (typeof value !== 'object' && typeof value !== 'function') {
    dom.setAttribute(key, value)
  }
}
