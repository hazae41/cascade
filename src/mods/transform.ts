import { Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
import { StreamError } from "./error.js"

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
    return this.transformer.controller.enqueue(chunk)
  }

  error(reason?: any) {
    return this.transformer.controller.error(reason)
  }

  terminate() {
    return this.transformer.controller.terminate()
  }

}

export interface ResultableTransformer<I = any, O = any> {
  flush?: (controller: TransformStreamDefaultController<O>) => Promiseable<Result<void, unknown>>;
  start?: (controller: TransformStreamDefaultController<O>) => Promiseable<Result<void, unknown>>;
  transform?: (chunk: I, controller: TransformStreamDefaultController<O>) => Promiseable<Result<void, unknown>>;
}


export class SuperTransformer<I, O> implements Transformer<I, O> {

  #controller?: TransformStreamDefaultController<O>

  constructor(
    readonly subtransformer: ResultableTransformer<I, O>
  ) { }

  get controller() {
    return this.#controller!
  }

  start(controller: TransformStreamDefaultController<O>) {
    this.#controller = controller

    const promiseable = this.subtransformer.start?.(controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  transform(chunk: I, controller: TransformStreamDefaultController<O>) {
    const promiseable = this.subtransformer.transform?.(chunk, controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

  flush(controller: TransformStreamDefaultController<O>) {
    const promiseable = this.subtransformer.flush?.(controller)

    if (promiseable instanceof Promise)
      return promiseable.then(r => r.mapErrSync(StreamError.new).unwrap())
    return promiseable?.mapErrSync(StreamError.new).unwrap()
  }

}