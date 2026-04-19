export {}

declare global {
  interface IssueTrackerBridge {
    isElectron: true
    platform: NodeJS.Platform
    versions: NodeJS.ProcessVersions
  }

  interface Window {
    issueTracker?: IssueTrackerBridge
  }
}
