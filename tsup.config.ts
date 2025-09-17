import fs from 'fs'
import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  // Conditional config: fast build (--no-dts) vs full build
  const dts = options.dts !== false
  const now = Date.now()
  return {
    entry: ['src/index.ts'],
    format: ['esm'],
    platform: 'node',
    target: 'node20',
    outDir: 'dist',
    dts,
    clean: dts,
    treeshake: dts,
    minify: dts,
    silent: !dts,
    skipNodeModulesBundle: true,
    esbuildOptions(options) {
      options.banner = {
        js: '#!/usr/bin/env node',
      }
      options.legalComments = 'none'
      options.drop = ['debugger']
    },
    async onSuccess() {
      // Fix deprecated import assertion syntax in built output
      const outputPath = 'dist/index.js'
      let content = fs.readFileSync(outputPath, 'utf-8')
      content = content.replace(
        /import\([^,]+,\s*\{\s*assert:\s*\{\s*type:\s*['"]json['"]\s*\}\s*\}\s*\)/g,
        (match) => match.replace('assert:', 'with:'),
      )
      fs.writeFileSync(outputPath, content, 'utf-8')
      if (!dts) {
        console.log(`Build success in ${Date.now() - now}ms`)
      }
    },
  }
})
