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

  error(reason?: any) {
    this.source.controller.error(reason)
  }

  close() {
    this.source.controller.close()
  }

}

export interface ResultableUnderlyingDefaultSource<R = any> {
  cancel?: (reason?: any) => Promiseable<Result<void, unknown>>;
  pull?: (controller: ReadableStreamDefaultController<R>) => Promiseable<Result<void, unknown>>;
  start?: (controller: ReadableStreamDefaultController<R>) => Promiseable<Result<void, unknown>>;
}

export class SuperUnderlyingDefaultSource<R> implements UnderlyingDefaultSource<R> {

  #controller?: ReadableStreamDefaultController<R>

  constructor(
    readonly subsource: ResultableUnderlyingDefaultSource<R>
  ) { }

  get controller() {
    return this.#controller!
  }

  start(controller: ReadableStreamDefaultController<R>) {
    this.#controller = controller

    const promiseable = this.subsource.start?.(controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  pull(controller: ReadableStreamDefaultController<R>) {
    const promiseable = this.subsource.start?.(controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  cancel(reason?: any) {
    const promiseable = this.subsource.cancel?.(reason)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

}