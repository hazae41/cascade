import { Awaitable } from "libs/promises/index.js"
import { Simplex, SimplexListener } from "./simplex.js"

export interface FullDuplexListener<IW, IR = IW, OW = IR, OR = IW> {
  readonly input?: SimplexListener<IW, OR>
  readonly output?: SimplexListener<OW, IR>

  close?(this: FullDuplex<IW, IR, OW, OR>): Awaitable<void>
  error?(this: FullDuplex<IW, IR, OW, OR>, reason?: unknown): Awaitable<void>
}

/**
 * A pair of simplexes that are closed independently
 */
export class FullDuplex<IW, IR = IW, OW = IR, OR = IW> {
  readonly inner: ReadableWritablePair<IR, IW>
  readonly outer: ReadableWritablePair<OR, OW>

  readonly input: Simplex<IW, OR>
  readonly output: Simplex<OW, IR>

  #closing?: { reason?: unknown }
  #closed?: { reason?: unknown }

  constructor(
    readonly listener: FullDuplexListener<IW, IR, OW, OR> = {}
  ) {
    this.input = new Simplex<IW, OR>({
      ...listener.input,
      close: () => this.#onInputClose(),
      error: e => this.#onInputError(e)
    })

    this.output = new Simplex<OW, IR>({
      ...listener.output,
      close: () => this.#onOutputClose(),
      error: e => this.#onOutputError(e)
    })

    this.inner = {
      readable: this.output.readable,
      writable: this.input.writable
    }

    this.outer = {
      readable: this.input.readable,
      writable: this.output.writable
    }
  }

  [Symbol.dispose]() {
    this.close()
  }

  get closing() {
    return this.#closing
  }

  get closed() {
    return this.#closed
  }

  async #onInputClose() {
    await this.listener.input?.close?.call(this.input)

    if (!this.output.closing)
      return

    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    await this.listener.close?.call(this)

    this.#closed = {}
  }

  async #onOutputClose() {
    await this.listener.output?.close?.call(this.output)

    if (!this.input.closing)
      return

    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    await this.listener.close?.call(this)

    this.#closed = {}
  }

  async #onInputError(reason?: unknown) {
    await this.listener.input?.error?.call(this.input, reason)

    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    this.output.error(reason)

    await this.listener.error?.call(this, reason)

    this.#closed = { reason }
  }

  async #onOutputError(reason?: unknown) {
    await this.listener.output?.error?.call(this.output, reason)

    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    this.input.error(reason)

    await this.listener.error?.call(this, reason)

    this.#closed = { reason }
  }

  error(reason?: unknown) {
    this.output.error(reason)
  }

  close() {
    try {
      this.input.close()
    } finally {
      this.output.close()
    }
  }

}

export interface HalfDuplexListener<IW, IR = IW, OW = IR, OR = IW> {
  readonly input?: SimplexListener<IW, OR>
  readonly output?: SimplexListener<OW, IR>

  close?(this: HalfDuplex<IW, IR, OW, OR>): Awaitable<void>
  error?(this: HalfDuplex<IW, IR, OW, OR>, reason?: unknown): Awaitable<void>
}

/**
 * A pair of simplexes that are closed together
 */
export class HalfDuplex<IW, IR = IW, OW = IR, OR = IW> {
  readonly inner: ReadableWritablePair<IR, IW>
  readonly outer: ReadableWritablePair<OR, OW>

  readonly input: Simplex<IW, OR>
  readonly output: Simplex<OW, IR>

  #closing?: { reason?: unknown }
  #closed?: { reason?: unknown }

  constructor(
    readonly listener: HalfDuplexListener<IW, IR, OW, OR> = {}
  ) {
    this.input = new Simplex<IW, OR>({
      ...listener.input,
      close: () => this.#onInputClose(),
      error: e => this.#onInputError(e)
    })

    this.output = new Simplex<OW, IR>({
      ...listener.output,
      close: () => this.#onOutputClose(),
      error: e => this.#onOutputError(e)
    })

    this.inner = {
      readable: this.output.readable,
      writable: this.input.writable
    }

    this.outer = {
      readable: this.input.readable,
      writable: this.output.writable
    }
  }

  [Symbol.dispose]() {
    this.close()
  }

  get closing() {
    return this.#closing
  }

  get closed() {
    return this.#closed
  }

  async #onInputClose() {
    await this.listener.input?.close?.call(this.input)

    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    this.output.close()

    await this.listener.close?.call(this)

    this.#closed = {}
  }

  async #onOutputClose() {
    await this.listener.output?.close?.call(this.output)

    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    this.input.close()

    await this.listener.close?.call(this)

    this.#closed = {}
  }

  async #onInputError(reason?: unknown) {
    await this.listener.input?.error?.call(this.input, reason)

    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    this.output.error(reason)

    await this.listener.error?.call(this, reason)

    this.#closed = { reason }
  }

  async #onOutputError(reason?: unknown) {
    await this.listener.output?.error?.call(this.output, reason)

    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    this.input.error(reason)

    await this.listener.error?.call(this, reason)

    this.#closed = { reason }
  }

  error(reason?: unknown) {
    this.output.error(reason)
  }

  close() {
    this.output.close()
  }

}
