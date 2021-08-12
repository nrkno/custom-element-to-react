import buble from '@rollup/plugin-buble'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { uglify } from 'rollup-plugin-uglify'
import serve from 'rollup-plugin-serve'
import pkg from './package.json'

const name = pkg.name.replace('@nrk/', '')
const banner = `/*! @nrk/${name} v${pkg.version} - Copyright (c) 2019-${new Date().getFullYear()} NRK */`
const globals = { react: 'React' }
const external = Object.keys(globals)
const plugins = [
  resolve(),
  commonjs(),
  buble(),
  Boolean(process.env.ROLLUP_WATCH) && serve('lib')
]

export default [{
  input: 'lib/index.js',
  output: [
    { format: 'cjs', file: `lib/${name}.js`, exports: 'default' },
    { format: 'esm', file: `lib/${name}.mjs` }
  ],
  plugins,
  external
}, {
  input: 'lib/index.js',
  output: { format: 'iife', file: `lib/${name}.min.js`, name: 'customElementToReact', banner, globals },
  plugins: plugins.concat(uglify({ output: { comments: /^!/ } })),
  external
}]
