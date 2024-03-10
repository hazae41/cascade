import { None } from "@hazae41/option"
import { SuperEventTarget } from "@hazae41/plume"
import { CloseEvents, ErrorEvents } from "mods/cascade/plexes/events.js"
import { Simplex } from "./simplex.js"

/**
 * A pair of simplexes that are NOT connected to each other
 */
export class FullDuplex<I, O> {
  readonly inner: ReadableWritablePair<O, I>
  readonly outer: ReadableWritablePair<I, O>

  readonly input: Simplex<I>
  readonly output: Simplex<O>

  constructor() {
    this.input = new Simplex<I>()
    this.output = new Simplex<O>()

    this.inner = {
      readable: this.output.readable,
      writable: this.input.writable
    }

    this.outer = {
      readable: this.input.readable,
      writable: this.output.writable
    }
  }
}

export type HalfDuplexEvents =
  & CloseEvents
  & ErrorEvents

/**
 * A pair of simplexes that are connected to each other
 */
export class HalfDuplex<I, O, M extends HalfDuplexEvents = HalfDuplexEvents> {
  readonly inner: ReadableWritablePair<O, I>
  readonly outer: ReadableWritablePair<I, O>

  readonly input: Simplex<I>
  readonly output: Simplex<O>

  readonly events = new SuperEventTarget<M>()

  #closing?: { reason?: unknown }
  #closed?: { reason?: unknown }

  constructor() {
    this.input = new Simplex<I>()
    this.output = new Simplex<O>()

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

  get closed() {
    return this.#closed
  }

  async #onInputClose() {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = {}

    /**
     * Close the other end
     */
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

    /**
     * Close the other end
     */
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

    /**
     * Close the other end
     */
    this.output.error(reason)

    await this.events.emit("close")
    this.#closed = { reason }
  }

  async #onOutputError(reason?: unknown) {
    if (this.#closed)
      return
    if (this.#closing)
      return
    this.#closing = { reason }

    /**
     * Close the other end
     */
    this.input.error(reason)

    await this.events.emit("close")
    this.#closed = { reason }
  }

  async error(reason?: unknown) {
    await this.output.error(reason)
  }

  async close() {
    await this.output.close()
  }

}
