
export class SuperWritableStream<W> {

  readonly sink: SuperUnderlyingSink<W>

  closed?: { reason?: unknown }

  /**
   * Like a WritableStream but with a getter to its controller and a "closed" field
   * @param subsink 
   * @param strategy 
   */
  constructor(
    readonly subsink: UnderlyingSink<W>,
    readonly strategy?: QueuingStrategy<W>
  ) {
    this.sink = new SuperUnderlyingSink(subsink)
  }

  get controller() {
    return this.sink.controller
  }

  start() {
    const { sink, strategy } = this
    return new WritableStream(sink, strategy)
  }

  get signal() {
    return this.controller.signal
  }

  error(reason?: unknown) {
    this.controller.error(reason)
  }

}

export class SuperUnderlyingSink<W> implements UnderlyingSink<W> {

  #controller?: WritableStreamDefaultController

  constructor(
    readonly inner: UnderlyingSink<W>
  ) { }

  get controller() {
    if (this.#controller == null)
      throw new Error("Controller not set")
    return this.#controller
  }

  async start(controller: WritableStreamDefaultController) {
    this.#controller = controller

    return this.inner.start?.(this.controller)
  }

  async write(chunk: W) {
    return this.inner.write?.(chunk, this.controller)
  }

  async abort(reason?: unknown) {
    return this.inner.abort?.(reason)
  }

  async close() {
    return this.inner.close?.()
  }

}