const store = new Map<string, unknown>()

export const configStore = {
  get<T>(key: string, defaultValue: T): T {
    return (store.get(key) as T) ?? defaultValue
  },

  set<T>(key: string, value: T): void {
    store.set(key, value)
  },

  delete(key: string): void {
    store.delete(key)
  },
}
