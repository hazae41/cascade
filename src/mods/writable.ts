import { Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { StreamError } from "./error.js"

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

  start() {
    const { sink, strategy } = this
    return new WritableStream(sink, strategy)
  }

  error(reason?: any) {
    this.sink.controller.error(reason)
  }

  get signal() {
    return this.sink.controller.signal
  }

}

export interface ResultableUnderlyingSink<W = any> {
  abort?: (reason?: any) => Promiseable<Result<void, unknown>>;
  close?: () => Promiseable<Result<void, unknown>>;
  start?: (controller: WritableStreamDefaultController) => Promiseable<Result<void, unknown>>;
  write?: (chunk: W, controller: WritableStreamDefaultController) => Promiseable<Result<void, unknown>>;
}

export class SuperUnderlyingSink<W> implements UnderlyingSink<W> {

  #controller?: WritableStreamDefaultController

  constructor(
    readonly subsink: ResultableUnderlyingSink<W>
  ) { }

  get controller() {
    return this.#controller!
  }

  start(controller: WritableStreamDefaultController) {
    this.#controller = controller

    return this.subsink.start?.(controller)
  }

  write(chunk: W, controller: WritableStreamDefaultController) {
    const promiseable = this.subsink.write?.(chunk, controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  abort(reason?: any) {
    const promiseable = this.subsink.abort?.(reason)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  close() {
    const promiseable = this.subsink.close?.()

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

}