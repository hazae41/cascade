import { Awaitable } from "libs/promises/index.js"
import { SuperReadableStream } from "../streams/readable.js"
import { SuperWritableStream } from "../streams/writable.js"

export interface SimplexParams<W, R = W> {
  start?(this: Simplex<W, R>): Awaitable<void>
  close?(this: Simplex<W, R>): Awaitable<void>
  error?(this: Simplex<W, R>, reason?: unknown): Awaitable<void>
  write?(this: Simplex<W, R>, chunk: W): Awaitable<void>
}

export class Simplex<W, R = W> {

  readonly #reader: SuperReadableStream<R>
  readonly #writer: SuperWritableStream<W>

  #starting = false
  #started = false

  #closing?: { reason?: unknown }
  #closed?: { reason?: unknown }

  constructor(
    readonly params: SimplexParams<W, R> = {}
  ) {
    this.#writer = new SuperWritableStream<W>({
      start: () => this.#onStart(),
      write: c => this.#onWrite(c),
      close: () => this.#onClose(),
      abort: e => this.#onError(e)
    })

    this.#reader = new SuperReadableStream<R>({
      cancel: e => this.#onError(e)
    })
  }

  [Symbol.dispose]() {
    this.close()
  }

  get readable() {
    return this.#reader.substream
  }

  get writable() {
    return this.#writer.substream
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
    if (this.#starting)
      return
    this.#starting = true

    try {
      await this.params.start?.call(this)
    } finally {
      this.#started = true
    }
  }

  async #onClose() {
    if (this.#closing)
      return
    this.#closing = {}

    try {
      await this.params.close?.call(this)

      try {
        this.#reader.close()
      } catch { }

      try {
        this.#writer.error()
      } catch { }

      this.#closed = {}
    } catch (reason: unknown) {
      this.#closing = { reason }

      try {
        this.#reader.error(reason)
      } catch { }

      try {
        this.#writer.error(reason)
      } catch { }

      this.#closed = { reason }
    }
  }

  async #onError(reason?: unknown) {
    if (this.#closing)
      return
    this.#closing = { reason }

    try {
      await this.params.error?.call(this, reason)
    } finally {
      try {
        this.#writer.error(reason)
      } catch { }

      try {
        this.#reader.error(reason)
      } catch { }

      this.#closed = { reason }
    }
  }

  async #onWrite(data: W) {
    await this.params.write?.call(this, data)
  }

  enqueue(chunk?: R) {
    this.#reader.enqueue(chunk)
  }

  error(reason?: unknown) {
    this.#onError(reason).catch(console.error)
  }

  close() {
    this.#onClose().catch(console.error)
  }

}