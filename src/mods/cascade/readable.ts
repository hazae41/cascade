
export class SuperReadableStream<R>  {

  readonly source: SuperUnderlyingDefaultSource<R>

  closed?: { reason?: unknown }

  /**
   * Like a ReadableStream but with a getter to its controller and a "closed" field
   * @param subsource 
   * @param strategy 
   */
  constructor(
    readonly subsource: UnderlyingDefaultSource<R>,
    readonly strategy?: QueuingStrategy<R>
  ) {
    this.source = new SuperUnderlyingDefaultSource(subsource)
  }

  get controller() {
    return this.source.controller
  }

  start() {
    const { source, strategy } = this
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

}

export class SuperUnderlyingDefaultSource<R> implements UnderlyingDefaultSource<R> {

  #controller?: ReadableStreamDefaultController<R>

  constructor(
    readonly inner: UnderlyingDefaultSource<R>
  ) { }

  get controller() {
    if (this.#controller == null)
      throw new Error("Controller not set")
    return this.#controller
  }

  async start(controller: ReadableStreamDefaultController<R>) {
    this.#controller = controller

    return this.inner.start?.(this.controller)
  }

  async pull() {
    return this.inner.pull?.(this.controller)
  }

  async cancel(reason?: unknown) {
    return this.inner.cancel?.(reason)
  }

}