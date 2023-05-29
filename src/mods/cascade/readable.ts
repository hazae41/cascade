import { None, Option, Some } from "@hazae41/option"
import { Catched, Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { Results } from "libs/results/results.js"
import { tryClose, tryEnqueue, tryError } from "./cascade.js"
import { ControllerError } from "./errors.js"

export class SuperReadableStream<R>  {

  readonly source: SuperUnderlyingDefaultSource<R>

  closed?: { reason?: unknown }

  /**
   * Like a ReadableStream but with a getter to its controller and a "closed" field
   * @param subsource 
   * @param strategy 
   */
  constructor(
    readonly subsource: ResultableUnderlyingDefaultSource<R>,
    readonly strategy?: QueuingStrategy<R>
  ) {
    this.source = new SuperUnderlyingDefaultSource(subsource)
  }

  get controller() {
    return this.source.controller
  }

  start() {
    const { source, strategy } = this
    return new ReadableStream(source, strategy)
  }

  enqueue(chunk?: R) {
    this.controller.enqueue(chunk)
  }

  error(reason?: unknown) {
    this.controller.error(reason)
  }

  close() {
    this.controller.close()
  }

  tryEnqueue(chunk?: R): Result<void, ControllerError> {
    return tryEnqueue(this, chunk)
  }

  tryError(reason?: unknown): Result<void, ControllerError> {
    return tryError(this, reason)
  }

  tryClose(): Result<void, ControllerError> {
    return tryClose(this)
  }

}

export interface ResultableUnderlyingDefaultSource<R = unknown> {
  cancel?: (reason?: unknown) => Promiseable<Result<void, unknown>>;
  pull?: (controller: ReadableStreamDefaultController<R>) => Promiseable<Result<void, unknown>>;
  start?: (controller: ReadableStreamDefaultController<R>) => Promiseable<Result<void, unknown>>;
}

export class SuperUnderlyingDefaultSource<R> implements UnderlyingDefaultSource<R> {

  #controller: Option<ReadableStreamDefaultController<R>> = new None()

  constructor(
    readonly inner: ResultableUnderlyingDefaultSource<R>
  ) { }

  get controller() {
    return this.#controller.unwrap()
  }

  start(controller: ReadableStreamDefaultController<R>) {
    try {
      this.#controller = new Some(controller)

      const promiseable = this.inner.start?.(this.controller)

      if (promiseable instanceof Promise)
        return promiseable
          .catch(Catched.fromAndThrow)
          .then(Results.okOrThrow)

      if (promiseable === undefined)
        return
      return Results.okOrThrow(promiseable)
    } catch (e: unknown) {
      throw Catched.from(e)
    }
  }

  pull(controller: ReadableStreamDefaultController<R>) {
    try {
      const promiseable = this.inner.pull?.(this.controller)

      if (promiseable instanceof Promise)
        return promiseable
          .catch(Catched.fromAndThrow)
          .then(Results.okOrThrow)

      if (promiseable === undefined)
        return
      return Results.okOrThrow(promiseable)
    } catch (e: unknown) {
      throw Catched.from(e)
    }
  }

  cancel(reason?: unknown) {
    try {
      const promiseable = this.inner.cancel?.(reason)

      if (promiseable instanceof Promise)
        return promiseable
          .catch(Catched.fromAndThrow)
          .then(Results.okOrThrow)

      if (promiseable === undefined)
        return
      return Results.okOrThrow(promiseable)
    } catch (e: unknown) {
      throw Catched.from(e)
    }
  }

}