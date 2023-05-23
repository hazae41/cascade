import { None, Option, Some } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { tryError } from "./cascade.js"
import { ControllerError, StreamError } from "./errors.js"

export class SuperWritableStream<W> {

  readonly inner: SuperUnderlyingSink<W>

  closed?: { reason?: unknown }

  /**
   * Like a WritableStream but with a getter to its controller and a "closed" field
   * @param subinner 
   * @param strategy 
   */
  constructor(
    readonly subinner: ResultableUnderlyingSink<W>,
    readonly strategy?: QueuingStrategy<W>
  ) {
    this.inner = new SuperUnderlyingSink(subinner)
  }

  get controller() {
    return this.inner.controller
  }

  start() {
    const { inner: sink, strategy } = this
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
  start?: (controller: SuperWritableStreamDefaultController) => Promiseable<Result<void, unknown>>;
  write?: (chunk: W, controller: SuperWritableStreamDefaultController) => Promiseable<Result<void, unknown>>;
}

export class SuperWritableStreamDefaultController implements WritableStreamDefaultController {

  constructor(
    readonly inner: WritableStreamDefaultController
  ) { }

  get signal() {
    return this.inner.signal
  }

  error(reason?: unknown) {
    this.inner.error(StreamError.from(reason))
  }

  tryError(reason?: unknown): Result<void, ControllerError> {
    return tryError(this, reason)
  }

}

export class SuperUnderlyingSink<W> implements UnderlyingSink<W> {

  #controller: Option<SuperWritableStreamDefaultController> = new None()

  constructor(
    readonly inner: ResultableUnderlyingSink<W>
  ) { }

  get controller() {
    return this.#controller.unwrap()
  }

  start(controller: WritableStreamDefaultController) {
    this.#controller = new Some(new SuperWritableStreamDefaultController(controller))

    const promiseable = this.inner.start?.(this.controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.from).unwrap())
    return promiseable?.mapErrSync(StreamError.from).unwrap()
  }

  write(chunk: W) {
    const promiseable = this.inner.write?.(chunk, this.controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.from).unwrap())
    return promiseable?.mapErrSync(StreamError.from).unwrap()
  }

  abort(reason?: unknown) {
    const promiseable = this.inner.abort?.(reason)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.from).unwrap())
    return promiseable?.mapErrSync(StreamError.from).unwrap()
  }

  close() {
    const promiseable = this.inner.close?.()

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.from).unwrap())
    return promiseable?.mapErrSync(StreamError.from).unwrap()
  }

}