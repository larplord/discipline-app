import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['.next/**', 'node_modules/**', 'dist/**', 'legacy-vite/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
];
