import { Future } from "@hazae41/future"

export class SuperTransformStream<I, O> {

  readonly transformer: SuperTransformer<I, O>

  readonly substream: TransformStream<I, O>

  /**
   * Like a TransformStream but with a getter to its controller
   * @param subtransformer 
   * @param writableStrategy 
   * @param readableStrategy 
   */
  constructor(
    readonly subtransformer: Transformer<I, O>,
    readonly writableStrategy?: QueuingStrategy<I>,
    readonly readableStrategy?: QueuingStrategy<O>
  ) {
    this.transformer = new SuperTransformer(subtransformer)
    this.substream = new TransformStream(this.transformer, writableStrategy, readableStrategy)
  }

  [Symbol.dispose]() {
    this.terminate().catch(console.error)
  }

  async [Symbol.asyncDispose]() {
    await this.terminate()
  }

  get controller() {
    return this.transformer.controller
  }

  async enqueue(chunk?: O) {
    const controller = await this.controller

    controller.enqueue(chunk)
  }

  async error(reason?: unknown) {
    const controller = await this.controller

    controller.error(reason)
  }

  async terminate() {
    const controller = await this.controller

    controller.terminate()
  }

}

export class SuperTransformer<I, O> implements Transformer<I, O> {

  #controller = new Future<TransformStreamDefaultController<O>>()

  constructor(
    readonly inner: Transformer<I, O>
  ) { }

  get controller() {
    return this.#controller.promise
  }

  async start(controller: TransformStreamDefaultController<O>) {
    this.#controller.resolve(controller)
    return this.inner.start?.(controller)
  }

  async transform(chunk: I) {
    return this.inner.transform?.(chunk, await this.controller)
  }

  async flush() {
    return this.inner.flush?.(await this.controller)
  }

}