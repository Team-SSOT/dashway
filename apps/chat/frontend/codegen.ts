import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: '../backend/src/main/resources/schema/chat.graphqls',
  documents: 'src/data/wire/operations/**/*.graphql',
  generates: {
    'src/data/wire/__generated__/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        scalars: {
          Long: 'string',
          DateTime: 'string',
        },
        avoidOptionals: false,
        immutableTypes: false,
      },
    },
  },
}

export default config
