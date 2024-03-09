import { SuperEventTarget } from "@hazae41/plume"
import { CloseEvents, ErrorEvents, FlushEvents, MessageEvents, OpenEvents } from "libs/events/events.js"
import { SuperTransformStream } from "../streams/transform.js"

export type SimplexEvents<T> =
  & OpenEvents
  & CloseEvents
  & ErrorEvents
  & MessageEvents<T>
  & FlushEvents

export class Simplex<T>  {
  readonly readable: ReadableStream<T>
  readonly writable: WritableStream<T>

  readonly events = new SuperEventTarget<SimplexEvents<T>>()
  readonly stream: SuperTransformStream<T, T>

  #started = false

  #closing?: { reason?: unknown }
  #closed?: { reason?: unknown }

  constructor() {
    const start = this.#onStart.bind(this)
    const transform = this.#onTransform.bind(this)
    const flush = this.#onFlush.bind(this)

    this.stream = new SuperTransformStream<T, T>({ start, transform, flush })

    const before = this.stream.substream
    const after = new TransformStream<T, T>({})

    this.readable = after.readable
    this.writable = before.writable

    before.readable
      .pipeTo(after.writable)
      .then(this.#onClose.bind(this))
      .catch(this.#onError.bind(this))
      .catch(console.error)
  }

  get started() {
    return this.#started
  }

  get closed() {
    return this.#closed
  }

  async #onStart() {
    await this.events.emit("open", [])
    this.#started = true
  }

  async #onClose() {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}
    await this.events.emit("close", [])
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

  async #onTransform(data: T) {
    await this.events.emit("message", [data])
  }

  async #onFlush() {
    await this.events.emit("flush", [])
  }

  async enqueue(chunk?: T) {
    return await this.stream.enqueue(chunk)
  }

  async error(reason?: unknown) {
    return await this.stream.error(reason)
  }

  async close() {
    return await this.stream.terminate()
  }

}