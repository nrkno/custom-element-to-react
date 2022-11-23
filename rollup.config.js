import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import serve from 'rollup-plugin-serve'
import { terser } from 'rollup-plugin-terser'
import packageInfo from './package.json'

const { name, version } = packageInfo
const shortName = name.replace('@nrk/', '')
const banner = `/*! ${name} v${version} - Copyright (c) 2019-${new Date().getFullYear()} NRK */`
const globals = { react: 'React' }
const external = Object.keys(globals)
const plugins = [
  resolve(),
  commonjs(),
  babel({ presets: [['@babel/preset-env', { modules: false }]], babelHelpers: 'bundled' }),
  Boolean(process.env.ROLLUP_WATCH) && serve('lib')
]

export default [{
  input: 'lib/index.js',
  output: [
    { format: 'cjs', file: `lib/${shortName}.js`, exports: 'default' },
    { format: 'esm', file: `lib/${shortName}.mjs` }
  ],
  plugins,
  external
}, {
  input: 'lib/index.js',
  output: { format: 'iife', file: `lib/${shortName}.min.js`, name: 'customElementToReact', banner, globals },
  plugins: plugins.concat(terser({ format: { comments: /^!/ } })),
  external
}]
