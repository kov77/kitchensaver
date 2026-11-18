import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const MOBILE_SRC = 'apps/mobile/src'

function restrictImports(layer, patterns) {
  return {
    files: [`${MOBILE_SRC}/${layer}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: patterns.map((group) => ({
            group: [group],
            message: `${layer} must not import from ${group}`,
          })),
        },
      ],
    },
  }
}

const COMPONENT_LAYERS = {
  molecules: '@/components/molecules/**',
  organisms: '@/components/organisms/**',
  templates: '@/components/templates/**',
}

const mobileLayerRules = [
  restrictImports('components/atoms', [
    COMPONENT_LAYERS.molecules,
    COMPONENT_LAYERS.organisms,
    COMPONENT_LAYERS.templates,
    '@/sections/**',
    '@/core/**',
    '@/api/**',
  ]),
  restrictImports('components/molecules', [
    COMPONENT_LAYERS.organisms,
    COMPONENT_LAYERS.templates,
    '@/sections/**',
    '@/core/**',
    '@/api/**',
  ]),
  restrictImports('components/organisms', [
    COMPONENT_LAYERS.templates,
    '@/sections/**',
    '@/api/**',
  ]),
  restrictImports('components/templates', ['@/sections/**', '@/api/**']),
  restrictImports('core', ['@/components/**', '@/sections/**']),
  restrictImports('utils', ['@/components/**', '@/sections/**', '@/api/**']),
  restrictImports('api', ['@/components/**', '@/sections/**']),
  restrictImports('theme', [
    '@/components/**',
    '@/sections/**',
    '@/core/**',
    '@/api/**',
    '@/utils/**',
  ]),
  restrictImports('sections', ['@/sections/**']),
]

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/generated/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      eqeqeq: ['error', 'always'],
      'no-else-return': 'error',
    },
  },
  ...mobileLayerRules,
  prettier,
)
