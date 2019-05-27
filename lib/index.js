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
* customElementToReact
* @param {Class|Function} elem A custom element definition.
* @param {Array} attr Props and events
* @return {Object} A React component
*/
export default function customElementToReact (element, options = {}) {
  const name = element.name || String(element).match(/function ([^(]+)/)[1] // String match for IE11
  const props = options.props || []
  const events = options.customEvents || []
  const tag = `${name}-${options.suffix || 'react'}`.replace(/\W+/, '-').toLowerCase()
  if (IS_BROWSER && !window.customElements.get(tag)) window.customElements.define(tag, element)

  return class extends React.Component {
    constructor (props) {
      super(props)
      this.ref = (el) => (this.el = el)
      events.forEach((key) => {
        const on = `on${key.replace(/(^|\.)./g, (m) => m.slice(-1).toUpperCase())}` // input.filter => onInputFilter
        this[key] = (event) => this.props[on] && closest(event.target, this.el.nodeName) === this.el && this.props[on](event)
      })
    }
    componentDidMount () {
      props.forEach((key) => this.props.hasOwnProptery(key) && (this.el[key] = this.props[key]))
      events.forEach((key) => this.el.addEventListener(key, this[key]))
    }
    componentDidUpdate (prev) { props.forEach((key) => prev[key] !== this.props[key] && (this.el[key] = this.props[key])) }
    componentWillUnmount () { events.forEach((key) => this.el.removeEventListener(key, this[key])) }
    render () {
      // Convert React props to CustomElement props https://github.com/facebook/react/issues/12810
      return React.createElement(tag, Object.keys(this.props).reduce((props, key) => {
        if (key === 'className') props.class = this.props[key] // Fixes className for custom elements
        else if (this.props[key] === true) props[key] = '' // Fixes boolean attributes
        else if (this.props[key] !== false) props[key] = this.props[key]
        return props
      }, { ref: this.ref }))
    }
  }
}
