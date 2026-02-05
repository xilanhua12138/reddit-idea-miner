export const LIBRARY_EVENT = "rim:library:update"

export function emitLibraryUpdate() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(LIBRARY_EVENT))
}
