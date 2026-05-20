import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'did-method-plc/**'] },
  tseslint.configs.recommended,
);
