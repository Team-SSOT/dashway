export function useIsLive(): boolean {
  return import.meta.env.VITE_CHAT_DATA_SOURCE === 'live'
}
