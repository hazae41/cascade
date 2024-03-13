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

  #closing?: { reason?: never }
  #closed?: { reason?: never }

  #erroring?: { reason?: unknown }
  #errored?: { reason?: unknown }

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

  get erroring() {
    return this.#erroring
  }

  get errored() {
    return this.#errored
  }

  get stopped() {
    return this.#errored || this.#closed
  }

  async #onStart() {
    if (this.#starting)
      return
    this.#starting = true

    try {
      await this.params.start?.call(this)
    } catch (e: unknown) {
      this.error(e)
      throw e
    }

    this.#started = true
  }

  async #onClose() {
    if (this.#closing)
      return
    this.#closing = {}

    try {
      await this.params.close?.call(this)
    } catch (e: unknown) {
      this.error(e)
      throw e
    }

    try {
      this.#reader.close()
    } catch { }

    try {
      this.#writer.error()
    } catch { }

    this.#closed = {}
  }

  async #onError(reason?: unknown) {
    if (this.#erroring)
      return
    this.#erroring = { reason }

    try {
      await this.params.error?.call(this, reason)
    } finally {
      try {
        this.#writer.error(reason)
      } catch { }

      try {
        this.#reader.error(reason)
      } catch { }

      this.#errored = { reason }
    }
  }

  async #onWrite(data: W) {
    if (this.params.write == null) {
      this.enqueue(data as any as R)
      return
    }

    try {
      await this.params.write?.call(this, data)
    } catch (e: unknown) {
      this.error(e)
      throw e
    }
  }

  enqueue(chunk?: R) {
    try {
      this.#reader.enqueue(chunk)
    } catch { }
  }

  error(reason?: unknown) {
    this.#onError(reason).catch(console.error)
  }

  close() {
    this.#onClose().catch(console.error)
  }

}