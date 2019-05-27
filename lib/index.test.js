/* eslint no-undef: 0, react/jsx-no-undef: 0  */

import test from 'ava'
import path from 'path'
import puppeteer from 'puppeteer'

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
  t.true(await page.evaluate(() => comp instanceof React.Component))
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).nodeName), 'TEST-REACT')
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

test('element to react from element with props', withPage, async (t, page) => {
  await page.evaluate(() => (window.Test = customElementToReact(class Test extends window.HTMLElement {}, { customEvents: ['event1'] })))
  await page.evaluate(() => (window.comp = ReactDOM.render(<Test bool str='string' num={3} className='class' />, document.createElement('div'))))
  t.true(await page.evaluate(() => comp.event1 instanceof Function))
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).getAttribute('bool')), '')
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).getAttribute('str')), 'string')
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).getAttribute('num')), '3')
  t.is(await page.evaluate(() => ReactDOM.findDOMNode(comp).getAttribute('class')), 'class')
})
