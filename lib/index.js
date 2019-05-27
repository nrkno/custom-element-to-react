import React from 'react'

const IS_BROWSER = typeof window !== 'undefined'

/**
* closest
* @param {Element} element Element to traverse up from
* @param {String} selector A selector to search for matching parents or element itself
* @return {Element|null}  Element which is the closest ancestor matching selector
*/
const closest = (() => {
  const proto = typeof window === 'undefined' ? {} : window.Element.prototype
  const match = proto.matches || proto.msMatchesSelector || proto.webkitMatchesSelector
  return proto.closest ? (el, css) => el.closest(css) : (el, css) => {
    for (;el; el = el.parentElement) if (match.call(el, css)) return el
    return null
  }
})()

/**
* getUUID
* @return {String} A generated unique ID
*/
function getUUID (el) {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

/**
* customElementToReact
* @param {Class|Function} elem A custom element definition.
* @param {Array} attr Props and events
* @return {Object} A React component
*/
export default function customElementToReact (element, ...attr) {
  const name = element.name || String(element).match(/function ([^(]+)/)[1] // String match for IE11
  const tag = `${name.replace(/\W+/, '-')}-${getUUID()}`.toLowerCase()
  if (IS_BROWSER && !window.customElements.get(tag)) window.customElements.define(tag, element)

  return class extends React.Component {
    constructor (props) {
      super(props)
      this.ref = (el) => (this.el = el)
      attr.forEach((k) => {
        const on = `on${k.replace(/(^|\.)./g, (m) => m.slice(-1).toUpperCase())}` // input.filter => onInputFilter
        this[k] = (event) => this.props[on] && closest(event.target, this.el.nodeName) === this.el && this.props[on](event)
      })
    }
    componentDidMount () { attr.forEach((k) => this.props[k] ? (this.el[k] = this.props[k]) : this.el.addEventListener(k, this[k])) }
    componentDidUpdate (prev) { attr.forEach((k) => prev[k] !== this.props[k] && (this.el[k] = this.props[k])) }
    componentWillUnmount () { attr.forEach((k) => this.el.removeEventListener(k, this[k])) }
    render () {
      // Convert React props to CustomElement props https://github.com/facebook/react/issues/12810
      return React.createElement(tag, Object.keys(this.props).reduce((props, k) => {
        if (k === 'className') props.class = this.props[k] // Fixes className for custom elements
        else if (this.props[k] === true) props[k] = '' // Fixes boolean attributes
        else if (this.props[k] !== false) props[k] = this.props[k]
        return props
      }, { ref: this.ref }))
    }
  }
}
