import { None, Option, Some } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { tryError } from "./cascade.js"
import { CatchedError, ControllerError, StreamError } from "./errors.js"

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
    try {
      this.#controller = new Some(new SuperWritableStreamDefaultController(controller))

      const promiseable = this.inner.start?.(this.controller)

      if (promiseable instanceof Promise)
        return promiseable
          .then(StreamError.okOrFromAndThrow)
          .catch(CatchedError.fromAndThrow)

      if (promiseable === undefined)
        return
      return StreamError.okOrFromAndThrow(promiseable)
    } catch (e: unknown) {
      throw CatchedError.from(e)
    }
  }

  write(chunk: W) {
    try {
      const promiseable = this.inner.write?.(chunk, this.controller)

      if (promiseable instanceof Promise)
        return promiseable
          .then(StreamError.okOrFromAndThrow)
          .catch(CatchedError.fromAndThrow)

      if (promiseable === undefined)
        return
      return StreamError.okOrFromAndThrow(promiseable)
    } catch (e: unknown) {
      throw CatchedError.from(e)
    }
  }

  abort(reason?: unknown) {
    try {
      const promiseable = this.inner.abort?.(reason)

      if (promiseable instanceof Promise)
        return promiseable
          .then(StreamError.okOrFromAndThrow)
          .catch(CatchedError.fromAndThrow)

      if (promiseable === undefined)
        return
      return StreamError.okOrFromAndThrow(promiseable)
    } catch (e: unknown) {
      throw CatchedError.from(e)
    }
  }

  close() {
    try {
      const promiseable = this.inner.close?.()

      if (promiseable instanceof Promise)
        return promiseable
          .then(StreamError.okOrFromAndThrow)
          .catch(CatchedError.fromAndThrow)

      if (promiseable === undefined)
        return
      return StreamError.okOrFromAndThrow(promiseable)
    } catch (e: unknown) {
      throw CatchedError.from(e)
    }
  }

}