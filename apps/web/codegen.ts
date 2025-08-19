import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,

  schema: 'http://localhost:3000/graphql',

  documents: './src/lib/graphql/documents/**/*.{ts,tsx}',

  config: {
    dedupeFragments: true,
  },

  generates: {
    'src/graphql/generated/sdk.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-generic-sdk'],
      config: {
        dedupeOperationSuffix: true,
      },
    },
    'src/graphql/generated/hooks.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
      config: {
        withComponent: false,
      },
    },
  },
}

export default config
