import { Awaitable } from "libs/promises/index.js"
import { Simplex, SimplexParams } from "./simplex.js"

export interface FullDuplexParams<IW, IR = IW, OW = IR, OR = IW> {
  readonly input?: SimplexParams<IW, OR>
  readonly output?: SimplexParams<OW, IR>

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
    readonly params: FullDuplexParams<IW, IR, OW, OR> = {}
  ) {
    this.input = new Simplex<IW, OR>({
      ...params.input,
      close: () => this.#onInputClose(),
      error: e => this.#onInputError(e)
    })

    this.output = new Simplex<OW, IR>({
      ...params.output,
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
    try {
      await this.params.input?.close?.call(this.input)
    } finally {
      if (!this.output.closing)
        return

      if (this.#closing)
        return
      this.#closing = {}

      try {
        await this.params.close?.call(this)
      } finally {
        this.#closed = {}
      }
    }
  }

  async #onOutputClose() {
    try {
      await this.params.output?.close?.call(this.output)
    } finally {
      if (!this.input.closing)
        return

      if (this.#closing)
        return
      this.#closing = {}

      try {
        await this.params.close?.call(this)
      } finally {
        this.#closed = {}
      }
    }
  }

  async #onInputError(reason?: unknown) {
    try {
      await this.params.input?.error?.call(this.input, reason)
    } finally {
      if (this.#closing)
        return
      this.#closing = { reason }

      this.output.error(reason)

      try {
        await this.params.error?.call(this, reason)
      } finally {
        this.#closed = { reason }
      }
    }
  }

  async #onOutputError(reason?: unknown) {
    try {
      await this.params.output?.error?.call(this.output, reason)
    } finally {
      if (this.#closing)
        return
      this.#closing = { reason }

      this.input.error(reason)

      try {
        await this.params.error?.call(this, reason)
      } finally {
        this.#closed = { reason }
      }
    }
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

export interface HalfDuplexParams<IW, IR = IW, OW = IR, OR = IW> {
  readonly input?: SimplexParams<IW, OR>
  readonly output?: SimplexParams<OW, IR>

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
    readonly params: HalfDuplexParams<IW, IR, OW, OR> = {}
  ) {
    this.input = new Simplex<IW, OR>({
      ...params.input,
      close: () => this.#onInputClose(),
      error: e => this.#onInputError(e)
    })

    this.output = new Simplex<OW, IR>({
      ...params.output,
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
    try {
      await this.params.input?.close?.call(this.input)
    } finally {
      if (this.#closing)
        return
      this.#closing = {}

      this.output.close()

      try {
        await this.params.close?.call(this)
      } finally {
        this.#closed = {}
      }
    }
  }

  async #onOutputClose() {
    try {
      await this.params.output?.close?.call(this.output)
    } finally {
      if (this.#closing)
        return
      this.#closing = {}

      this.input.close()

      try {
        await this.params.close?.call(this)
      } finally {
        this.#closed = {}
      }
    }
  }

  async #onInputError(reason?: unknown) {
    try {
      await this.params.input?.error?.call(this.input, reason)
    } finally {
      if (this.#closing)
        return
      this.#closing = { reason }

      this.output.error(reason)

      try {
        await this.params.error?.call(this, reason)
      } finally {
        this.#closed = { reason }
      }
    }
  }

  async #onOutputError(reason?: unknown) {
    try {
      await this.params.output?.error?.call(this.output, reason)
    } finally {
      if (this.#closing)
        return
      this.#closing = { reason }

      this.input.error(reason)

      try {
        await this.params.error?.call(this, reason)
      } finally {
        this.#closed = { reason }
      }
    }
  }

  error(reason?: unknown) {
    this.output.error(reason)
  }

  close() {
    this.output.close()
  }

}
