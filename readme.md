# custom-element-to-React

> Converts a [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) to a React component,
> with props and events.

## Usage

```
npm install @nrk/custom-element-to-react
```

```js
import React from 'react'
import customElementToReact from '@nrk/custom-element-to-react'

class MyElement extends HTMLElement {
  // ....
}

const MyComponent = customElementToReact(myComponent)
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
