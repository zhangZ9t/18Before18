import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: ['coverage/**'],
  },
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: {
        ...globals.node,
      },
    },
  },
]
