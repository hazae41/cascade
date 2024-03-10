export type OpenEvents = {
  open: () => void
}

export type CloseEvents = {
  close: () => void
}

export type ErrorEvents = {
  error: (reason?: unknown) => void
}

export type MessageEvents<T> = {
  message: (data: T) => void
}

export type FlushEvents = {
  flush: () => void
}