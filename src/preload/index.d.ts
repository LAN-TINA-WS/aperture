export {}

declare global {
  interface Window {
    api: import('../preload/index').ApertureAPI
  }
}
