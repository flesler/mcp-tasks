import del from 'rollup-plugin-delete'
import { dts } from 'rollup-plugin-dts'

export default {
  input: './dist/index.d.ts',
  output: {
    file: './dist/index.d.ts',
    format: 'es'
  },
  plugins: [
    dts(),
    del({
      targets: ['dist/**/*.d.ts', 'dist/*/', '!dist/index.d.ts'],
      hook: 'writeBundle',
      verbose: false
    })
  ]
}