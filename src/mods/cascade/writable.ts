import { None, Option, Some } from "@hazae41/option"
import { Catched, Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { Results } from "libs/results/results.js"
import { tryError } from "./cascade.js"
import { ControllerError } from "./errors.js"

export class SuperWritableStream<W> {

  readonly sink: SuperUnderlyingSink<W>

  closed?: { reason?: unknown }

  /**
   * Like a WritableStream but with a getter to its controller and a "closed" field
   * @param subsink 
   * @param strategy 
   */
  constructor(
    readonly subsink: ResultableUnderlyingSink<W>,
    readonly strategy?: QueuingStrategy<W>
  ) {
    this.sink = new SuperUnderlyingSink(subsink)
  }

  get controller() {
    return this.sink.controller
  }

  start() {
    const { sink, strategy } = this
    return new WritableStream(sink, strategy)
  }

  get signal() {
    return this.controller.signal
  }

  error(reason?: unknown) {
    this.controller.error(reason)
  }

  tryError(reason?: unknown): Result<void, ControllerError> {
    return tryError(this, reason)
  }

}

export interface ResultableUnderlyingSink<W = unknown> {
  abort?: (reason?: unknown) => Promiseable<Result<void, unknown>>;
  close?: () => Promiseable<Result<void, unknown>>;
  start?: (controller: WritableStreamDefaultController) => Promiseable<Result<void, unknown>>;
  write?: (chunk: W, controller: WritableStreamDefaultController) => Promiseable<Result<void, unknown>>;
}

export class SuperUnderlyingSink<W> implements UnderlyingSink<W> {

  #controller: Option<WritableStreamDefaultController> = new None()

  constructor(
    readonly inner: ResultableUnderlyingSink<W>
  ) { }

  get controller() {
    return this.#controller.unwrap()
  }

  async start(controller: WritableStreamDefaultController) {
    this.#controller = new Some(controller)

    return await Promise
      .resolve(this.inner.start?.(this.controller))
      .catch(Catched.fromAndThrow)
      .then(Results.okOrThrow)
  }

  async write(chunk: W) {
    return await Promise
      .resolve(this.inner.write?.(chunk, this.controller))
      .catch(Catched.fromAndThrow)
      .then(Results.okOrThrow)
  }

  async abort(reason?: unknown) {
    return await Promise
      .resolve(this.inner.abort?.(reason))
      .catch(Catched.fromAndThrow)
      .then(Results.okOrThrow)
  }

  async close() {
    return await Promise
      .resolve(this.inner.close?.())
      .catch(Catched.fromAndThrow)
      .then(Results.okOrThrow)
  }

}