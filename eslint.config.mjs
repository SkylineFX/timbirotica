// @ts-check
// Bugs and Vue mistakes only: formatting is Prettier's job, so @nuxt/eslint's
// stylistic rules stay off and eslint-config-prettier turns off the remaining
// rules that would fight Prettier's output. `npm run lint` runs it; CI fails
// on any finding.
import prettier from 'eslint-config-prettier/flat'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      // Header and Footer are single words, and renaming them gains nothing:
      // single-file components can't clash with <header> or <footer>.
      'vue/multi-word-component-names': 'off',
      // Optional props typed with `?` are undefined when left out; a default
      // of `undefined` for each would only repeat that.
      'vue/require-default-prop': 'off',
      // Removing a key from a lookup object (price drafts, query copies) is
      // what `delete` is for.
      '@typescript-eslint/no-dynamic-delete': 'off'
    }
  },
  prettier
)
