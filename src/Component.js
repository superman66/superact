import { render, patch } from './Element'

export default class Component {
  constructor(props) {
    this.props = props || {}
    this.state = null
  }
  static render(vdom, parent) {
    const props = Object.assign({}, this.props, vdom.props, {
      children: vdom.children,
    })

    if (Component.isPrototypeOf(vdom.type)) {
      const instance = new vdom.type(props)
      instance.componentWillMount()
      instance.base = render(instance.render(), parent)
      instance.base.__superactInstance = instance
      instance.base.__superactKey = vdom.props.key
      instance.componentDidMount()
      return instance.base
    }
    return render(vdom.type(props), parent)
  }

  static patch(dom, vdom, parent = dom.parent) {
    const nextProps = Object.assign({}, vdom.props, { children: vdom.children })

    // 如果存在实例，则调用 componentWillReceiveProps() 方法
    if (
      dom.__superactInstance &&
      dom.__superactInstance.constructor === vdom.type
    ) {
      dom.__superactInstance.componentWillReceiveProps(nextProps)
      dom.__superactInstance.props = nextProps
      return this.patch(dom, dom.__superactInstance.render(), parent)
    } else if (Component.isPrototypeOf(vdom.type)) {
      // 如果实例不存在，则 type 是 Component的话，则调用Component.render()
      const ndom = Component.render(vdom, parent)
      return parent ? ndom && parent.replceChild(ndom, dom) : ndom
    }
    // 如果为普通的Element类型，则调用 Element.patch()
    return this.patch(dom, vdom.type(nextProps), parent)
  }

  setState(nextState) {
    if (this.base && this.shouldComponentUpdate(this.props, nextState)) {
      const prevState = this.state
      this.componentWillUpdate(this.props, nextState)
      this.state = nextState
      patch(this.base, this.render())
      this.componentDidUpdate(this.props, prevState)
    } else {
      this.state = nextState
    }
  }

  // TODO: repalce shallowCompare
  shouldComponentUpdate(nextProps, nextState) {
    return nextProps !== this.props || nextState !== this.state
  }

  componentWillReceiveProps(nextProps, nextState) {
    return undefined
  }

  componentWillUpdate(prevProps, prevState) {
    return undefined
  }
  componentDidUpdate(prevProps, prevState) {
    return undefined
  }

  componentWillMount() {
    return undefined
  }

  componentDidMount() {
    return undefined
  }

  componentWillUnmout() {
    return undefined
  }
}
