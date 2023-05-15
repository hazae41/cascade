import { None, Option, Some } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { StreamError } from "./error.js"

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

  start() {
    const { source, strategy } = this
    return new ReadableStream(source, strategy)
  }

  enqueue(chunk?: R) {
    this.source.controller.enqueue(chunk)
  }

  error(reason?: unknown) {
    this.source.controller.error(reason)
  }

  close() {
    this.source.controller.close()
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

}

export class SuperUnderlyingDefaultSource<R> implements UnderlyingDefaultSource<R> {

  #controller: Option<SuperReadableStreamDefaultController<R>> = new None()

  constructor(
    readonly subsource: ResultableUnderlyingDefaultSource<R>
  ) { }

  get controller() {
    return this.#controller.unwrap()
  }

  start(controller: ReadableStreamDefaultController<R>) {
    this.#controller = new Some(new SuperReadableStreamDefaultController(controller))

    const promiseable = this.subsource.start?.(this.controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  pull(controller: ReadableStreamDefaultController<R>) {
    const promiseable = this.subsource.start?.(this.controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  cancel(reason?: unknown) {
    const promiseable = this.subsource.cancel?.(reason)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

}