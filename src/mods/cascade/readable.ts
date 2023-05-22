import { None, Option, Some } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { tryClose, tryEnqueue, tryError } from "./cascade.js"
import { StreamControllerError, StreamError } from "./errors.js"

export class SuperReadableStream<R>  {

  readonly inner: SuperUnderlyingDefaultSource<R>

  closed?: { reason?: unknown }

  /**
   * Like a ReadableStream but with a getter to its controller and a "closed" field
   * @param subinner 
   * @param strategy 
   */
  constructor(
    readonly subinner: ResultableUnderlyingDefaultSource<R>,
    readonly strategy?: QueuingStrategy<R>
  ) {
    this.inner = new SuperUnderlyingDefaultSource(subinner)
  }

  get controller() {
    return this.inner.controller
  }

  start() {
    const { inner: source, strategy } = this
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

  tryEnqueue(chunk?: R): Result<void, StreamControllerError> {
    return tryEnqueue(this, chunk)
  }

  tryError(reason?: unknown): Result<void, StreamControllerError> {
    return tryError(this, reason)
  }

  tryClose(): Result<void, StreamControllerError> {
    return tryClose(this)
  }

}

export interface ResultableUnderlyingDefaultSource<R = unknown> {
  cancel?: (reason?: unknown) => Promiseable<Result<void, unknown>>;
  pull?: (controller: SuperReadableStreamDefaultController<R>) => Promiseable<Result<void, unknown>>;
  start?: (controller: SuperReadableStreamDefaultController<R>) => Promiseable<Result<void, unknown>>;
}

export class SuperReadableStreamDefaultController<R> implements ReadableStreamDefaultController<R> {

  constructor(
    readonly inner: ReadableStreamDefaultController<R>
  ) { }

  get desiredSize() {
    return this.inner.desiredSize
  }

  close() {
    this.inner.close()
  }

  enqueue(chunk?: R) {
    this.inner.enqueue(chunk)
  }

  error(reason?: unknown) {
    this.inner.error(new StreamError(reason))
  }

  tryEnqueue(chunk?: R): Result<void, StreamControllerError> {
    return tryEnqueue(this, chunk)
  }

  tryError(reason?: unknown): Result<void, StreamControllerError> {
    return tryError(this, reason)
  }

  tryClose(): Result<void, StreamControllerError> {
    return tryClose(this)
  }

}

export class SuperUnderlyingDefaultSource<R> implements UnderlyingDefaultSource<R> {

  #controller: Option<SuperReadableStreamDefaultController<R>> = new None()

  constructor(
    readonly inner: ResultableUnderlyingDefaultSource<R>
  ) { }

  get controller() {
    return this.#controller.unwrap()
  }

  start(controller: ReadableStreamDefaultController<R>) {
    this.#controller = new Some(new SuperReadableStreamDefaultController(controller))

    const promiseable = this.inner.start?.(this.controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  pull(controller: ReadableStreamDefaultController<R>) {
    const promiseable = this.inner.pull?.(this.controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  cancel(reason?: unknown) {
    const promiseable = this.inner.cancel?.(reason)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

}