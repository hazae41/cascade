import { Future } from "@hazae41/future"

export class SuperReadableStream<R>  {

  readonly source: SuperUnderlyingDefaultSource<R>

  readonly substream: ReadableStream<R>

  /**
   * Like a ReadableStream but with a getter to its controller
   * @param subsource 
   * @param strategy 
   */
  constructor(
    readonly subsource: UnderlyingDefaultSource<R>,
    readonly strategy?: QueuingStrategy<R>
  ) {
    this.source = new SuperUnderlyingDefaultSource(subsource)
    this.substream = new ReadableStream(this.source, strategy)
  }

  get controller() {
    return this.source.controller
  }

  async enqueue(chunk?: R) {
    const controller = await this.controller

    controller.enqueue(chunk)
  }

  async error(reason?: unknown) {
    const controller = await this.controller

    controller.error(reason)
  }

  async close() {
    const controller = await this.controller

    controller.close()
  }

}

export class SuperUnderlyingDefaultSource<R> implements UnderlyingDefaultSource<R> {

  #controller = new Future<ReadableStreamDefaultController<R>>()

  constructor(
    readonly inner: UnderlyingDefaultSource<R>
  ) { }

  get controller() {
    return this.#controller.promise
  }

  async start(controller: ReadableStreamDefaultController<R>) {
    this.#controller.resolve(controller)
    return this.inner.start?.(controller)
  }

  async pull() {
    return this.inner.pull?.(await this.controller)
  }

  async cancel(reason?: unknown) {
    return this.inner.cancel?.(reason)
  }

}