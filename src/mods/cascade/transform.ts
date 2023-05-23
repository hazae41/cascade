import { None, Option, Some } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { tryEnqueue, tryError, tryTerminate } from "./cascade.js"
import { CatchedError, ControllerError, StreamError } from "./errors.js"

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
    this.inner.error(StreamError.from(reason))
  }

  terminate(): void {
    this.inner.terminate()
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

export class SuperTransformer<I, O> implements Transformer<I, O> {

  #controller: Option<SuperTransformStreamDefaultController<O>> = new None()

  constructor(
    readonly inner: ResultableTransformer<I, O>
  ) { }

  get controller() {
    return this.#controller.unwrap()
  }

  start(controller: TransformStreamDefaultController<O>) {
    try {
      this.#controller = new Some(new SuperTransformStreamDefaultController(controller))

      const promiseable = this.inner.start?.(this.controller)

      if (promiseable instanceof Promise)
        return promiseable
          .catch(CatchedError.fromAndThrow)
          .then(StreamError.okOrFromAndThrow)

      if (promiseable === undefined)
        return
      return StreamError.okOrFromAndThrow(promiseable)
    } catch (e: unknown) {
      throw CatchedError.from(e)
    }
  }

  transform(chunk: I) {
    try {
      const promiseable = this.inner.transform?.(chunk, this.controller)

      if (promiseable instanceof Promise)
        return promiseable
          .catch(CatchedError.fromAndThrow)
          .then(StreamError.okOrFromAndThrow)

      if (promiseable === undefined)
        return
      return StreamError.okOrFromAndThrow(promiseable)
    } catch (e: unknown) {
      throw CatchedError.from(e)
    }
  }

  flush() {
    try {
      const promiseable = this.inner.flush?.(this.controller)

      if (promiseable instanceof Promise)
        return promiseable
          .catch(CatchedError.fromAndThrow)
          .then(StreamError.okOrFromAndThrow)

      if (promiseable === undefined)
        return
      return StreamError.okOrFromAndThrow(promiseable)
    } catch (e: unknown) {
      throw CatchedError.from(e)
    }
  }

}