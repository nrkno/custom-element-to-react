import React from 'react'

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
export default function customElementToReact (elementClass, options = {}) {
  const name = elementClass.name || String(elementClass).match(/function ([^(]+)/)[1] // String match for IE11
  const dashCase = name.replace(/.[A-Z]/g, ([a, b]) => `${a}-${b}`) // NameName -> name-name
  const customProps = options.props || []
  const customEvents = options.customEvents || []
  const skipProps = customProps.slice() // Keep a copy
  const tagName = `${dashCase}-${options.suffix || 'react'}`.replace(/\W+/g, '-').toLowerCase()

  skipProps.push('innerRef')

  return class extends React.Component {
    constructor (props) {
      super(props)
      this.ref = (el) => {
        if (this.props.innerRef) {
          this.props.innerRef.current = el
        }
        return (this.el = el)
      }
      customEvents.forEach((eventName) => {
        const on = `on${eventName.replace(/(^|\.)./g, (m) => m.slice(-1).toUpperCase())}` // input.filter => onInputFilter
        this[eventName] = (event) => this.props[on] && closest(event.target, this.el.nodeName) === this.el && this.props[on](event)
        skipProps.push(on) // Skip props that are customEvents
      })
    }
    componentDidMount () {
      // Do not run connectedCallback before after React componentDidMount, to allow React hydration to run first
      if (!window.customElements.get(tagName)) window.customElements.define(tagName, elementClass)

      customProps.forEach((key) => this.props.hasOwnProperty(key) && (this.el[key] = this.props[key]))
      customEvents.forEach((key) => this.el.addEventListener(key, this[key]))
    }
    componentDidUpdate (prev) {
      customProps.forEach((key) => prev[key] !== this.props[key] && (this.el[key] = this.props[key]))
    }
    componentWillUnmount () {
      customEvents.forEach((eventName) => this.el.removeEventListener(eventName, this[eventName]))
    }
    render () {
      // Convert React props to CustomElement props https://github.com/facebook/react/issues/12810
      return React.createElement(tagName, Object.keys(this.props).reduce((thisProps, key) => {
        if (skipProps.indexOf(key) === -1) { // Do not render customEvents and custom props as attributes
          if (key === 'className') thisProps.class = this.props[key] // Fixes className for custom elements
          else if (this.props[key] === true) thisProps[key] = '' // Fixes boolean attributes
          else if (this.props[key] !== false) thisProps[key] = this.props[key] // Pass only truthy, non-function props
        }
        return thisProps
      }, { ref: this.ref }))
    }
  }
}
