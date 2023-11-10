import { None, Option, Some } from "@hazae41/option"
import { Catched, Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { Resultable } from "libs/results/results.js"
import { tryEnqueue, tryError, tryTerminate } from "./cascade.js"
import { ControllerError } from "./errors.js"

export class SuperTransformStream<I, O>  {

  readonly transformer: SuperTransformer<I, O>

  closed?: { reason?: unknown }

  /**
   * Like a TransformStream but with a getter to its controller and a "closed" field
   * @param subtransformer 
   * @param writableStrategy 
   * @param readableStrategy 
   */
  constructor(
    readonly subtransformer: ResultableTransformer<I, O>,
    readonly writableStrategy?: QueuingStrategy<I>,
    readonly readableStrategy?: QueuingStrategy<O>
  ) {
    this.transformer = new SuperTransformer(subtransformer)
  }

  get controller() {
    return this.transformer.controller
  }

  start() {
    const { transformer, writableStrategy, readableStrategy } = this
    return new TransformStream(transformer, writableStrategy, readableStrategy)
  }

  enqueue(chunk?: O) {
    return this.controller.enqueue(chunk)
  }

  error(reason?: unknown) {
    return this.controller.error(reason)
  }

  terminate() {
    return this.controller.terminate()
  }

  tryEnqueue(chunk?: O): Result<void, ControllerError> {
    return tryEnqueue(this, chunk)
  }

  tryError(reason?: unknown): Result<void, ControllerError> {
    return tryError(this, reason)
  }

  tryTerminate(): Result<void, ControllerError> {
    return tryTerminate(this)
  }

}

export interface ResultableTransformer<I = unknown, O = unknown> {
  flush?: (controller: TransformStreamDefaultController<O>) => Promiseable<Resultable<void, unknown>>
  start?: (controller: TransformStreamDefaultController<O>) => Promiseable<Resultable<void, unknown>>
  transform?: (chunk: I, controller: TransformStreamDefaultController<O>) => Promiseable<Resultable<void, unknown>>
}

export class SuperTransformer<I, O> implements Transformer<I, O> {

  #controller: Option<TransformStreamDefaultController<O>> = new None()

  constructor(
    readonly inner: ResultableTransformer<I, O>
  ) { }

  get controller() {
    return this.#controller.unwrap()
  }

  async start(controller: TransformStreamDefaultController<O>) {
    this.#controller = new Some(controller)

    return await Promise
      .resolve(this.inner.start?.(this.controller))
      .catch(Catched.fromAndThrow)
      .then(Resultable.okOrThrow)
  }

  async transform(chunk: I) {
    return await Promise
      .resolve(this.inner.transform?.(chunk, this.controller))
      .catch(Catched.fromAndThrow)
      .then(Resultable.okOrThrow)
  }

  async flush() {
    return await Promise
      .resolve(this.inner.flush?.(this.controller))
      .catch(Catched.fromAndThrow)
      .then(Resultable.okOrThrow)
  }

}