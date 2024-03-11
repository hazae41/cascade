import { Awaitable } from "libs/promises/index.js"
import { SuperTransformStream } from "../streams/transform.js"

export interface SimplexListener<W, R = W> {
  open?(this: Simplex<W, R>): Awaitable<void>
  close?(this: Simplex<W, R>): Awaitable<void>
  error?(this: Simplex<W, R>, reason?: unknown): Awaitable<void>
  message?(this: Simplex<W, R>, message: W): Awaitable<void>
  flush?(this: Simplex<W, R>): Awaitable<void>
}

export class Simplex<W, R = W> {
  readonly readable: ReadableStream<R>
  readonly writable: WritableStream<W>

  readonly stream: SuperTransformStream<W, R>

  #starting = false
  #started = false

  #closing?: { reason?: unknown }
  #closed?: { reason?: unknown }

  constructor(
    readonly listener: SimplexListener<W, R> = {}
  ) {
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
    this.close()
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
    this.#starting = true

    await this.listener.open?.call(this)

    this.#started = true
  }

  async #onClose() {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    await this.listener.close?.call(this)

    this.#closed = {}
  }

  async #onError(reason?: unknown) {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    await this.listener.error?.call(this, reason)

    this.#closed = { reason }
  }

  async #onTransform(data: W) {
    await this.listener.message?.call(this, data)
  }

  async #onFlush() {
    await this.listener.flush?.call(this)
  }

  enqueue(chunk?: R) {
    return this.stream.enqueue(chunk)
  }

  error(reason?: unknown) {
    return this.stream.error(reason)
  }

  close() {
    return this.stream.terminate()
  }

}