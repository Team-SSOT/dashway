import { Environment, type FetchFunction, Network, RecordSource, Store } from 'relay-runtime'

const fetchFn: FetchFunction = async (params, variables) => {
  const response = await fetch('http://localhost:8080/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: params.text,
      variables,
    }),
  })

  return await response.json()
}

export function createRelayEnvironment(): Environment {
  return new Environment({
    network: Network.create(fetchFn),
    store: new Store(new RecordSource()),
  })
}
