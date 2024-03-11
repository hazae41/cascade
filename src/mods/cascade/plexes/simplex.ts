import { SuperEventTarget } from "@hazae41/plume"
import { SuperTransformStream } from "../streams/transform.js"

export type OpenEvents = {
  open: () => void
}

export type CloseEvents = {
  close: () => void
}

export type ErrorEvents = {
  error: (reason?: unknown) => void
}

export type MessageEvents<I> = {
  message: (data: I) => void
}

export type FlushEvents = {
  flush: () => void
}

export type SimplexEvents<R> =
  & OpenEvents
  & CloseEvents
  & ErrorEvents
  & MessageEvents<R>
  & FlushEvents

export class Simplex<W, R = W> {
  readonly readable: ReadableStream<R>
  readonly writable: WritableStream<W>

  readonly stream: SuperTransformStream<W, R>

  readonly events = new SuperEventTarget<SimplexEvents<W>>()

  #starting = false
  #started = false

  #closing?: { reason?: unknown }
  #closed?: { reason?: unknown }

  constructor() {
    const start = this.#onStart.bind(this)
    const transform = this.#onTransform.bind(this)
    const flush = this.#onFlush.bind(this)

    this.stream = new SuperTransformStream<W, R>({ start, transform, flush })

    const before = this.stream.substream
    const after = new TransformStream<R, R>({})

    this.readable = after.readable
    this.writable = before.writable

    before.readable
      .pipeTo(after.writable)
      .then(this.#onClose.bind(this))
      .catch(this.#onError.bind(this))
      .catch(console.error)
  }

  [Symbol.dispose]() {
    this.close().catch(console.error)
  }

  async [Symbol.asyncDispose]() {
    await this.close()
  }

  get starting() {
    return this.#starting
  }

  get started() {
    return this.#started
  }

  get closing() {
    return this.#closing
  }

  get closed() {
    return this.#closed
  }

  async #onStart() {
    if (this.#started)
      return
    if (this.#starting)
      return
    this.#starting = false

    await this.events.emit("open")
    this.#started = true
  }

  async #onClose() {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    await this.events.emit("close")
    this.#closed = {}
  }

  async #onError(reason?: unknown) {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    await this.events.emit("error", [reason])
    this.#closed = { reason }
  }

  async #onTransform(data: W) {
    await this.events.emit("message", data)
  }

  async #onFlush() {
    await this.events.emit("flush")
  }

  async enqueue(chunk?: R) {
    return await this.stream.enqueue(chunk)
  }

  async error(reason?: unknown) {
    return await this.stream.error(reason)
  }

  async close() {
    return await this.stream.terminate()
  }

}