/* eslint no-undef: 0, react/jsx-no-undef: 0, react/no-render-return-value: 0, react/no-find-dom-node: 0  */

import test from 'ava'
import path from 'path'
import puppeteer from 'puppeteer'

let originalConsole = global.console

// This runs before each test
test.beforeEach(t => {
  originalConsole = global.console
})

// This runs after each test and other test hooks, even if they failed
test.afterEach.always(t => {
  global.console = originalConsole
})

async function withPage (t, run) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  page.on('console', msg => console.log(msg._text))
  await page.addScriptTag({ path: path.resolve(__dirname, '..', 'node_modules/react/umd/react.development.js') })
  await page.addScriptTag({ path: path.resolve(__dirname, '..', 'node_modules/react-dom/umd/react-dom.development.js') })
  await page.addScriptTag({ path: path.resolve(__dirname, 'custom-element-to-react.min.js') })
  try {
    await run(t, page)
  } finally {
    await page.close()
    await browser.close()
  }
}

test('converts from simple class', withPage, async (t, page) => {
  await page.evaluate(() => (window.Test = customElementToReact(class Test extends window.HTMLElement {})))
  await page.evaluate(() => (window.comp = ReactDOM.render(<Test />, document.createElement('div'))))
  t.true(await page.evaluate(() => Test instanceof Function))
  t.true(await page.evaluate(() => comp instanceof React.Component))
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).nodeName), 'TEST-REACT')
})

test('converts from simple function', withPage, async (t, page) => {
  await page.evaluate(() => (window.Test = customElementToReact(function Test () {})))
  await page.evaluate(() => (window.comp = ReactDOM.render(<Test />, document.createElement('div'))))
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).nodeName), 'TEST-REACT')
})

test('use forwardRef to get an ref to the custom-element and compute its height with useRef', withPage, async (t, page) => {
  await page.evaluate(() => (window.SuperParagraph = customElementToReact(class SuperParagraph extends HTMLElement {
  })))
  await page.evaluate(() => (window.CalculatedHeight = () => {
    const [height, setHeight] = React.useState(0)
    const ref = React.useRef(null)
    React.useEffect(() => {
      if (ref.current) {
        setHeight(ref.current.scrollHeight)
      }
    }, [])

    return <SuperParagraph style={{ height: '99px', display: 'block' }} forwardRef={ref}>My calculated height: {height}</SuperParagraph>
  }))
  await page.evaluate(() => {
    const divElement = document.createElement('div')
    divElement.setAttribute('id', 'react-app')
    document.querySelector('body').appendChild(divElement)
  })
  await page.evaluate(() => (window.comp = ReactDOM.render(<CalculatedHeight />, document.querySelector('#react-app'))))
  await page.waitForTimeout(100) // Wait until the React.useEffect has run and updated the height
  t.is(await page.evaluate(() => document.querySelector('#react-app').textContent), 'My calculated height: 99')
})

test('use forwardRef to get an ref to the custom-element and compute its height using callback ref', withPage, async (t, page) => {
  await page.evaluate(() => (window.SuperParagraph = customElementToReact(class SuperParagraph extends HTMLElement {
  })))
  await page.evaluate(() => (window.CalculatedHeight = class CalculatedHeight extends React.Component {
    constructor (props) {
      super(props)

      this.setElementRef = element => {
        this.elementRef = element
      }
      this.state = { height: 0 }
    }

    componentDidMount () {
      if (this.elementRef) {
        this.setState({ height: this.elementRef.scrollHeight })
      }
    }

    render () {
      const { height } = this.state

      return (
        <SuperParagraph style={{ height: '99px', display: 'block' }} forwardRef={this.setElementRef}>
          My calculated height: {height}
        </SuperParagraph>
      )
    }
  }))
  await page.evaluate(() => {
    const divElement = document.createElement('div')
    divElement.setAttribute('id', 'react-app')
    document.querySelector('body').appendChild(divElement)
  })
  await page.evaluate(() => (window.comp = ReactDOM.render(<CalculatedHeight />, document.querySelector('#react-app'))))
  await page.waitForTimeout(100) // Wait until the React.useEffect has run and updated the height
  t.is(await page.evaluate(() => document.querySelector('#react-app').textContent), 'My calculated height: 99')
})

test('use forwardRef to get an ref to the custom-element and compute its height using React.createRef', withPage, async (t, page) => {
  await page.evaluate(() => (window.SuperParagraph = customElementToReact(class SuperParagraph extends HTMLElement {
  })))
  await page.evaluate(() => (window.CalculatedHeight = class CalculatedHeight extends React.Component {
    constructor (props) {
      super(props)

      this.elementRef = React.createRef()
      this.state = { height: 0 }
    }

    componentDidMount () {
      if (this.elementRef.current) {
        this.setState({ height: this.elementRef.current.scrollHeight })
      }
    }

    render () {
      const { height } = this.state

      return (
        <SuperParagraph style={{ height: '99px', display: 'block' }} forwardRef={this.elementRef}>
          My calculated height: {height}
        </SuperParagraph>
      )
    }
  }))
  await page.evaluate(() => {
    const divElement = document.createElement('div')
    divElement.setAttribute('id', 'react-app')
    document.querySelector('body').appendChild(divElement)
  })
  await page.evaluate(() => (window.comp = ReactDOM.render(<CalculatedHeight />, document.querySelector('#react-app'))))
  await page.waitForTimeout(100) // Wait until the React.useEffect has run and updated the height
  t.is(await page.evaluate(() => document.querySelector('#react-app').textContent), 'My calculated height: 99')
})

test('converts from class with props and events', withPage, async (t, page) => {
  await page.evaluate(() => (window.Test = customElementToReact(class Test extends window.HTMLElement {}, {
    props: ['prop1', 'prop2'],
    customEvents: ['event1', 'event2']
  })))
  await page.evaluate(() => (window.comp = ReactDOM.render(<Test prop1={1234} prop3 onEvent1={() => {}} />, document.createElement('div'))))
  t.is(await page.evaluate(() => comp.props.prop1), 1234)
  t.is(await page.evaluate(() => comp.props.prop2), undefined)
  t.is(await page.evaluate(() => comp.props.prop3), true)
  t.true(await page.evaluate(() => comp.event1 instanceof Function))
  t.true(await page.evaluate(() => comp.event2 instanceof Function))
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).hasAttribute('prop1')), false)
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).getAttribute('prop2')), null)
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).hasAttribute('onEvent1')), false)
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).getAttribute('prop3')), '')
})

test('sets tag name from suffix option', withPage, async (t, page) => {
  await page.evaluate(() => (window.Test = customElementToReact(function Test () {}, { suffix: '1234' })))
  await page.evaluate(() => (window.comp = ReactDOM.render(<Test />, document.createElement('div'))))
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).nodeName), 'TEST-1234')
})

test('sets tag name from capitalized', withPage, async (t, page) => {
  await page.evaluate(() => (window.TestTest = customElementToReact(class TestTest extends window.HTMLElement {})))
  await page.evaluate(() => (window.comp = ReactDOM.render(<TestTest />, document.createElement('div'))))
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).nodeName), 'TEST-TEST-REACT')
})

test('sets tag name from camelcased', withPage, async (t, page) => {
  await page.evaluate(() => (window.TestTest = customElementToReact(function testTest () {})))
  await page.evaluate(() => (window.comp = ReactDOM.render(<TestTest />, document.createElement('div'))))
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).nodeName), 'TEST-TEST-REACT')
})

test('stringifies correctly for server side rendering', (t) => {
  const customElementToReact = require('./index.js').default
  const React = require('react')
  const ReactDOMServer = require('react-dom/server')
  global.HTMLElement = class {}
  const Test = customElementToReact(class Test extends HTMLElement {}, { props: ['prop1', 'prop2'], customEvents: ['event1', 'event2'], suffix: '1234' })
  const stringified = ReactDOMServer.renderToString(<Test prop1 prop2 prop3 disabled onEvent1={() => {}} />)
  t.is(stringified, '<test-1234 prop3="" disabled="" data-reactroot=""></test-1234>')
})

test('hydrates custom element before definition', withPage, async (t, page) => {
  const customElementToReact = require('./index.js').default
  const React = require('react')
  const ReactDOMServer = require('react-dom/server')
  global.HTMLElement = class {}
  const Test = customElementToReact(class Test extends HTMLElement {
    connectedCallback () {
      this.setAttribute('role', 'dialog')
    }
  })
  const stringified = ReactDOMServer.renderToString(<Test />)
  t.is(stringified, '<test-react data-reactroot=""></test-react>')

  // Mock `console.log` so we can test if React has logged a warning
  global.console = {
    lastLoggedMessage: undefined,
    log: (message) => (global.console.lastLoggedMessage = message),
    warn: (message) => global.console.log(message),
    error: (message) => global.console.log(message)
  }

  await page.evaluate(() => (window.container = document.createElement('div')))
  await page.evaluate((stringified) => (window.container.innerHTML = stringified), stringified)
  await page.evaluate(() => (document.body.appendChild(window.container)))

  await page.evaluate(() => (window.Test = customElementToReact(class Test extends HTMLElement {
    connectedCallback () {
      this.setAttribute('role', 'dialog')
    }
  })))
  await page.evaluate(() => (window.test = <Test />))
  await page.evaluate(() => (window.comp = ReactDOM.hydrate(window.test, window.container)))
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).nodeName), 'TEST-REACT')

  // If this test fails React will call `console.log` with the message `Warning: Extra attributes from the server: %s role`.
  // We can't rely on this exact warning message so we simply assert that `console.log` has not been called at all.
  t.falsy(global.console.lastLoggedMessage)
})
