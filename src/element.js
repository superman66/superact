import Component from './Component'

export function createElement(type, props, ...args) {
  let children = args.length ? [].concat(...args) : []
  return { type, props: props || {}, children }
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

function setProps(dom, props) {
  Object.keys(props).forEach(key => setProp(dom, key, props[key]))
}

function removeProps(dom, props) {
  Object.keys(props).forEach(key => {
    dom.removeAttribute(props[key])
  })
}

/**
 * 将 Virtual DOM 渲染到 真实 DOM
 * @param {*} vdom
 * @param {*} parent
 */
export const render = (vdom, parent = null) => {
  const mount = parent ? el => parent.appendChild(el) : el => el

  if (typeof vdom === 'string' || typeof vdom === 'number') {
    return mount(document.createTextNode(vdom))
  } else if (typeof vdom === 'boolean' || vdom === null) {
    return mount(document.createTextNode(''))
  } else if (typeof vdom === 'object' && vdom.type === 'function') {
    return Component.render(vdom, parent)
  } else if (typeof vdom === 'object' && vdom.type === 'string') {
    const dom = mount(document.createElement(vdom.type))
    vdom.children.forEach(child => render(child, dom))
    setProps(dom, vdom.props)
    return dom
  }
  throw new Error(`Invalid VDOM: ${vdom}`)
}

/**
 * DOM 更新
 * @param {*} dom 要新增的 dom
 * @param {*} vdom 当前 Virtual DOM
 * @param {*} parent dom parent 节点
 */
export function patch(dom, vdom, parent = dom.parentNode) {
  const replace = parent ? el => parent.replaceChild(el, dom) && el : el => el

  // vdom 为 Component 类型
  if (typeof vdom === 'object' && typeof vdom.type === 'function') {
    return Component.patch(dom, vdom, parent)
  } else if (typeof vdom !== 'object' && dom instanceof Text) {
    return dom.textContent !== vdom ? replace(render(vdom, parent)) : dom
  } else if (typeof vdom === 'object' && dom instanceof Text) {
    return replace(render(vdom, parent))
  } else if (
    typeof vdom === 'object' &&
    dom.nodeName !== vdom.type.toUpperCase()
  ) {
    return replace(render(vdom, parent))
  } else if (
    typeof vdom === 'object' &&
    dom.nodeName === vdom.type.toUpperCase()
  ) {
    // 用于存储 childNodes
    const pool = {}
    const active = document.activeElement
    Array.from(dom.nodeChildNodes).map((child, index) => {
      let key = child.__superactKey

      if (!key && child.tagName !== undefined) {
        key = child.tagName + index
      }
      if (!key && child.tagName === undefined) {
        key = child.textContent
        pool[key] = child
      }
    })

    vdom.children.map((child, index) => {
      let key = child.props && child.props.key

      // 如果 key 不存在 且 child 不是 Text 的话，则为每个 child 添加 key
      if (!key && child.type !== undefined) {
        key = child.type.toUpperCase() + index
      }

      // child 为 Text
      if (!key && child.type === undefined) {
        key = child.toString()
      }

      // key 存在，则更新节点
      if (pool[key] !== undefined) {
        dom.appendChild(patch(pool[key], child))
      }

      // key 不存在，直接渲染节点
      if (pool[key] === undefined) {
        dom.appendChild(render(child, dom))
      }

      delete pool[key]
    })

    Object.keys(pool).forEach(key => {
      const instance = pool[key].__superactInstance
      if (instance) instance.componentWillUnmout()
      pool[key].remove()
    })

    removeProps(dom, dom.attributes)
    setProp(dom, vdom.props)

    active.focus()
    return dom
  }
}
