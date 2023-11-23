
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
    readonly subtransformer: Transformer<I, O>,
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

}

export class SuperTransformer<I, O> implements Transformer<I, O> {

  #controller?: TransformStreamDefaultController<O>

  constructor(
    readonly inner: Transformer<I, O>
  ) { }

  get controller() {
    if (this.#controller == null)
      throw new Error("Controller not set")
    return this.#controller
  }

  async start(controller: TransformStreamDefaultController<O>) {
    this.#controller = controller

    return this.inner.start?.(this.controller)
  }

  async transform(chunk: I) {
    return this.inner.transform?.(chunk, this.controller)
  }

  async flush() {
    return this.inner.flush?.(this.controller)
  }

}