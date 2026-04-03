import { Environment, type FetchFunction, Network, RecordSource, Store } from 'relay-runtime'

const fetchFn: FetchFunction = async (params, variables) => {
  if (!params.text) {
    throw new Error('Desktop shell only supports text GraphQL operations.')
  }

  return window.desktop.shell.graphql({
    query: params.text,
    variables: (variables as Record<string, unknown>) ?? undefined,
    operationName: params.name,
  })
}

export function createRelayEnvironment(): Environment {
  return new Environment({
    network: Network.create(fetchFn),
    store: new Store(new RecordSource()),
  })
}
