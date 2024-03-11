import { None } from "@hazae41/option"
import { SuperEventTarget } from "@hazae41/plume"
import { CloseEvents, ErrorEvents, Simplex } from "./simplex.js"

export type FullDuplexEvents =
  & CloseEvents
  & ErrorEvents

/**
 * A pair of simplexes that are closed independently
 */
export class FullDuplex<IW, IR = IW, OW = IR, OR = IW> {
  readonly inner: ReadableWritablePair<IR, IW>
  readonly outer: ReadableWritablePair<OR, OW>

  readonly input: Simplex<IW, OR>
  readonly output: Simplex<OW, IR>

  readonly events = new SuperEventTarget<FullDuplexEvents>()

  #closing?: { reason?: unknown }
  #closed?: { reason?: unknown }

  constructor() {
    this.input = new Simplex<IW, OR>()
    this.output = new Simplex<OW, IR>()

    this.inner = {
      readable: this.output.readable,
      writable: this.input.writable
    }

    this.outer = {
      readable: this.input.readable,
      writable: this.output.writable
    }

    this.input.events.on("close", async () => {
      await this.#onInputClose()
      return new None()
    })

    this.output.events.on("close", async () => {
      await this.#onOutputClose()
      return new None()
    })

    this.input.events.on("error", async reason => {
      await this.#onInputError(reason)
      return new None()
    })

    this.output.events.on("error", async reason => {
      await this.#onOutputError(reason)
      return new None()
    })
  }

  [Symbol.dispose]() {
    this.close().catch(console.error)
  }

  async [Symbol.asyncDispose]() {
    await this.close()
  }

  get closing() {
    return this.#closing
  }

  get closed() {
    return this.#closed
  }

  async #onInputClose() {
    if (!this.output.closing)
      return

    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    await this.events.emit("close")
    this.#closed = {}
  }

  async #onOutputClose() {
    if (!this.input.closing)
      return

    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    await this.events.emit("close")
    this.#closed = {}
  }

  async #onInputError(reason?: unknown) {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    this.output.error(reason)

    await this.events.emit("error", reason)
    this.#closed = { reason }
  }

  async #onOutputError(reason?: unknown) {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    this.input.error(reason)

    await this.events.emit("error", reason)
    this.#closed = { reason }
  }

  async error(reason?: unknown) {
    await this.output.error(reason)
  }

  async close() {
    const ip = this.input.close()
    const op = this.output.close()

    await Promise.all([ip, op])
  }

}

export type HalfDuplexEvents =
  & CloseEvents
  & ErrorEvents

/**
 * A pair of simplexes that are closed together
 */
export class HalfDuplex<IW, IR = IW, OW = IR, OR = IW> {
  readonly inner: ReadableWritablePair<IR, IW>
  readonly outer: ReadableWritablePair<OR, OW>

  readonly input: Simplex<IW, OR>
  readonly output: Simplex<OW, IR>

  readonly events = new SuperEventTarget<HalfDuplexEvents>()

  #closing?: { reason?: unknown }
  #closed?: { reason?: unknown }

  constructor() {
    this.input = new Simplex<IW, OR>()
    this.output = new Simplex<OW, IR>()

    this.inner = {
      readable: this.output.readable,
      writable: this.input.writable
    }

    this.outer = {
      readable: this.input.readable,
      writable: this.output.writable
    }

    this.input.events.on("close", async () => {
      await this.#onInputClose()
      return new None()
    })

    this.output.events.on("close", async () => {
      await this.#onOutputClose()
      return new None()
    })

    this.input.events.on("error", async reason => {
      await this.#onInputError(reason)
      return new None()
    })

    this.output.events.on("error", async reason => {
      await this.#onOutputError(reason)
      return new None()
    })
  }

  [Symbol.dispose]() {
    this.close().catch(console.error)
  }

  async [Symbol.asyncDispose]() {
    await this.close()
  }

  get closing() {
    return this.#closing
  }

  get closed() {
    return this.#closed
  }

  async #onInputClose() {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    this.output.close()

    await this.events.emit("close")
    this.#closed = {}
  }

  async #onOutputClose() {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    this.input.close()

    await this.events.emit("close")
    this.#closed = {}
  }

  async #onInputError(reason?: unknown) {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    this.output.error(reason)

    await this.events.emit("error", reason)
    this.#closed = { reason }
  }

  async #onOutputError(reason?: unknown) {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    this.input.error(reason)

    await this.events.emit("error", reason)
    this.#closed = { reason }
  }

  async error(reason?: unknown) {
    await this.output.error(reason)
  }

  async close() {
    await this.output.close()
  }

}
