import withNuxt from './.nuxt/eslint.config.mjs';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

export default withNuxt(
  { ignores: ['legacy/**', 'public/**', 'server/db/migrations/**'] },
  {
    plugins: { 'better-tailwindcss': betterTailwindcss },
    settings: {
      'better-tailwindcss': { entryPoint: 'app/assets/css/main.css' },
    },
    rules: {
      ...betterTailwindcss.configs['recommended-warn'].rules,
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/enforce-canonical-classes': 'warn',
      'better-tailwindcss/enforce-shorthand-classes': 'warn',
      'better-tailwindcss/no-unknown-classes': 'warn',
      'vue/html-self-closing': ['warn', { html: { void: 'always', normal: 'always', component: 'always' } }],
      curly: ['error', 'all'],
      'func-style': ['warn', 'expression'],
      'prefer-arrow-callback': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
    },
  },
);
