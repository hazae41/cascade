import { None, Option, Some } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { tryEnqueue, tryError, tryTerminate } from "./cascade.js"
import { StreamControllerError, StreamError } from "./errors.js"

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

  start() {
    const { transformer, writableStrategy, readableStrategy } = this
    return new TransformStream(transformer, writableStrategy, readableStrategy)
  }

  enqueue(chunk?: O) {
    return this.transformer.controller.inner.enqueue(chunk)
  }

  error(reason?: unknown) {
    return this.transformer.controller.inner.error(reason)
  }

  terminate() {
    return this.transformer.controller.inner.terminate()
  }

  tryEnqueue(chunk?: O): Result<void, StreamControllerError> {
    return tryEnqueue(this, chunk)
  }

  tryError(reason?: unknown): Result<void, StreamControllerError> {
    return tryError(this, reason)
  }

  tryTerminate(): Result<void, StreamControllerError> {
    return tryTerminate(this)
  }

}

export interface ResultableTransformer<I = unknown, O = unknown> {
  flush?: (controller: SuperTransformStreamDefaultController<O>) => Promiseable<Result<void, unknown>>;
  start?: (controller: SuperTransformStreamDefaultController<O>) => Promiseable<Result<void, unknown>>;
  transform?: (chunk: I, controller: SuperTransformStreamDefaultController<O>) => Promiseable<Result<void, unknown>>;
}

export class SuperTransformStreamDefaultController<O> implements TransformStreamDefaultController<O> {

  constructor(
    readonly inner: TransformStreamDefaultController<O>
  ) { }

  get desiredSize() {
    return this.inner.desiredSize
  }

  enqueue(chunk?: O): void {
    this.inner.enqueue(chunk)
  }

  error(reason?: unknown): void {
    this.inner.error(new StreamError(reason))
  }

  terminate(): void {
    this.inner.terminate()
  }

  tryEnqueue(chunk?: O): Result<void, StreamControllerError> {
    return tryEnqueue(this, chunk)
  }

  tryError(reason?: unknown): Result<void, StreamControllerError> {
    return tryError(this, reason)
  }

  tryTerminate(): Result<void, StreamControllerError> {
    return tryTerminate(this)
  }

}

export class SuperTransformer<I, O> implements Transformer<I, O> {

  #controller: Option<SuperTransformStreamDefaultController<O>> = new None()

  constructor(
    readonly inner: ResultableTransformer<I, O>
  ) { }

  get controller() {
    return this.#controller.unwrap()
  }

  start(controller: TransformStreamDefaultController<O>) {
    this.#controller = new Some(new SuperTransformStreamDefaultController(controller))

    const promiseable = this.inner.start?.(this.controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  transform(chunk: I) {
    const promiseable = this.inner.transform?.(chunk, this.controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  flush() {
    const promiseable = this.inner.flush?.(this.controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

}