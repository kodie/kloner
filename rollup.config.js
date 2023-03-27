import { babel } from '@rollup/plugin-babel'

const config = {
  input: 'src/kloner.js',
  output: {
    dir: 'dist',
    format: 'umd',
    name: 'kloner',
    sourcemap: true
  },
  plugins: [
    babel({ babelHelpers: 'bundled' })
  ]
}

export default config
