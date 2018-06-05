/** @jsx createElement */

export function createElement(type, props, ...args) {
  let children = args.length ? [].concat(...args) : []
  return { type, props: props || {}, children }
}
