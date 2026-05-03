import { Environment, type FetchFunction, Network, RecordSource, Store } from 'relay-runtime'

const DEFAULT_ENDPOINT = 'http://localhost:8080/graphql'

const resolveEndpoint = (): string => {
  const fromEnv = import.meta.env.VITE_GRAPHQL_ENDPOINT
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv
  return DEFAULT_ENDPOINT
}

const fetchFn: FetchFunction = async (params, variables) => {
  const response = await fetch(resolveEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: params.text, variables }),
  })
  return await response.json()
}

export const createRelayEnvironment = (): Environment =>
  new Environment({
    network: Network.create(fetchFn),
    store: new Store(new RecordSource()),
  })
