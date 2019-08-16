# @nrk/custom-element-to-react [![Build Status](https://travis-ci.com/nrkno/custom-element-to-react.svg?branch=master)](https://travis-ci.com/nrkno/custom-element-to-react)

> Converts a [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) to a React component, with props and events.

## Installation

```
npm install @nrk/custom-element-to-react
```

## Usage

Given a custom element:

```js
// my-element.js
export default class MyElement extends HTMLElement { /* ... */ }
```

convert it to React component by passing in its class definition and a list of props and custom event names:
```js
import React from 'react'
import ReactDOM from 'react-dom'
import customElementToReact from '@nrk/custom-element-to-react'
import element from './my-element.js'

const MyElement = customElementToReact(element, {
  props: ['prop1', 'prop2'],            // Optional. Prop names to register in React
  customEvents: ['event1', 'event2'],   // Optional. Custom events names to register in React
  suffix: '123'                         // Optional. Adds a suffix to inner custom element tag name before registering. Use to control tag name of custom element. Default: 'react'
})

ReactDOM.render(<MyElement />, document.getElementById('div'))
```

## forwardRef

`forwardRef` provides access to the underlying CustomElement (DOM) itself instead of the React component.
```jsx
<MyElement
  ref={(comp) => console.log('MyElement React Component:', comp)}
  forwardRef={(node) => console.log('MyElement actual DOM Element:', node)}
/>
```

## Server side

If you're going to use this module to render a component in NodeJS, you should
 mock `HTMLElement` globally in order to make `MyElement extends HTMLElement` valid:

```js
if (typeof window !== 'undefined' && !global.HTMLElement) {
  global.HTMLElement = class {}
}
```

## Local development
First clone `@nrk/custom-element-to-react` and install its dependencies:

```bash
git clone git@github.com:nrkno/custom-element-to-react.git
cd custom-element-to-react
npm install # Installs dependencies for all packages
npm start # Your browser will open documentation with hot reloading
```

## Building and committing
After having applied changes, remember to build before pushing the changes upstream.

```bash
git checkout -b feature/my-changes
# update the source code
npm run build # Builds all the packages
git commit -am "Add my changes"
git push origin feature/my-changes
# then make a PR to the master branch,
# and assign another developer to review your code
```
