import React from 'react'

/**
* closest
* @param {Element} el Element to traverse up from
* @param {String} css A selector to search for matching parents or element itself
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
export function getUUID() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

/**
* customElementToReact
* @param {Class|Function} elementClass A custom element definition.
* @param {Array} options Props and custom events
* @return {Object} A React component
*/
export default function customElementToReact (elementClass, options = {}) {
  const suppliedName = options.name || elementClass.name || String(elementClass).match(/function ([^(]+)/)[1] // String match for IE11
  const name = `${suppliedName}-${getUUID()}` // Add UUID to supplied name in case of duplicates
  const dashCase = name.replace(/.[A-Z]/g, ([a, b]) => `${a}-${b}`) // NameName -> name-name
  const customProps = options.props || []
  const customEvents = options.customEvents || []
  const eventMap = customEvents.reduce((map, eventName) => {
    map[eventName] = `on${eventName.replace(/(^|\.)./g, (m) => m.slice(-1).toUpperCase())}` // input.filter => onInputFilter
    return map
  }, {})
  const skipProps = customProps.concat('forwardRef', Object.keys(eventMap).map(onEventName => eventMap[onEventName]))
  const tagName = `${dashCase}-${options.suffix || 'react'}`.replace(/\W+/g, '-').toLowerCase()

  return class extends React.Component {
    constructor (props) {
      super(props)
      // Register ref prop for accessing custom element https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
      this.ref = (el) => {
        if (typeof this.props.forwardRef === 'function') this.props.forwardRef(el)
        else if (this.props.forwardRef) this.props.forwardRef.current = el
        return (this.el = el)
      }
      // Register event handler on component for each custom event
      Object.keys(eventMap).forEach((eventName) => {
        const onEventName = eventMap[eventName]
        this[eventName] = (event) => {
          if (this.props[onEventName] && closest(event.target, this.el.nodeName) === this.el) {
            this.props[onEventName](event)
          }
        }
      })
    }

    componentDidMount () {
      // Run connectedCallback() after React componentDidMount() to allow React hydration to run first
      if (!window.customElements.get(tagName)) {
        window.customElements.define(tagName, elementClass)
      }

      // Populate properties on custom element
      customProps.forEach((propName) => {
        if (propName in this.props) {
          this.el[propName] = this.props[propName]
        }
      })

      // Register events on custom element
      customEvents.forEach((eventName) => {
        this.el.addEventListener(eventName, this[eventName])
      })
    }

    componentDidUpdate (prev) {
      // Sync prop changes to custom element
      customProps.forEach((propName) => {
        if (prev[propName] !== this.props[propName]) {
          this.el[propName] = this.props[propName]
        }
      })
    }

    componentWillUnmount () {
      // Remove event handlers on custom element on unmount
      customEvents.forEach((eventName) => {
        this.el.removeEventListener(eventName, this[eventName])
      })
    }

    render () {
      // Convert React props to CustomElement props https://github.com/facebook/react/issues/12810
      return React.createElement(tagName, Object.keys(this.props).reduce((thisProps, propName) => {
        if (skipProps.indexOf(propName) === -1) { // Do not render customEvents and custom props as attributes
          if (propName === 'className') thisProps.class = this.props[propName] // Fixes className for custom elements
          else if (this.props[propName] === true) thisProps[propName] = '' // Fixes boolean attributes
          else if (this.props[propName] !== false) thisProps[propName] = this.props[propName] // Pass only truthy, non-function props
        }
        return thisProps
      }, { ref: this.ref }))
    }
  }
}
