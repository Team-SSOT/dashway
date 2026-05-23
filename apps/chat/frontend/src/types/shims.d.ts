// Type declarations for Vite's ?raw import suffix
declare module '*.txt?raw' {
  const content: string
  export default content
}
