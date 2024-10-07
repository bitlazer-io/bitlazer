import { createFilter } from '@rollup/pluginutils'
import JavaScriptObfuscator from 'javascript-obfuscator'

export default function obfuscatorPlugin(options: any) {
  const filter = createFilter(options.include, options.exclude)

  return {
    name: 'vite-plugin-javascript-obfuscator',
    enforce: 'post' as const, // Explicitly type enforce as 'post'
    apply: 'build' as const, // Explicitly type apply as 'build'
    transform(code, id) {
      if (!filter(id)) {
        return null
      }

      const obfuscatedCode = JavaScriptObfuscator.obfuscate(
        code,
        options.obfuscatorOptions,
      ).getObfuscatedCode()
      return {
        code: obfuscatedCode,
        map: null,
      }
    },
  }
}
