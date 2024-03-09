import { Future } from "@hazae41/future"

export class SuperWritableStream<W> {

  readonly sink: SuperUnderlyingSink<W>

  readonly substream: WritableStream<W>

  /**
   * Like a WritableStream but with a getter to its controller
   * @param subsink 
   * @param strategy 
   */
  constructor(
    readonly subsink: UnderlyingSink<W>,
    readonly strategy?: QueuingStrategy<W>
  ) {
    this.sink = new SuperUnderlyingSink(subsink)
    this.substream = new WritableStream(this.sink, strategy)
  }

  get controller() {
    return this.sink.controller
  }

  get signal() {
    return this.#signal()
  }

  async #signal() {
    const controller = await this.controller

    return controller.signal
  }

  async error(reason?: unknown) {
    const controller = await this.controller

    controller.error(reason)
  }

}

export class SuperUnderlyingSink<W> implements UnderlyingSink<W> {

  #controller = new Future<WritableStreamDefaultController>()

  constructor(
    readonly inner: UnderlyingSink<W>
  ) { }

  get controller() {
    return this.#controller.promise
  }

  async start(controller: WritableStreamDefaultController) {
    this.#controller.resolve(controller)

    return this.inner.start?.(controller)
  }

  async write(chunk: W) {
    return this.inner.write?.(chunk, await this.controller)
  }

  async abort(reason?: unknown) {
    return this.inner.abort?.(reason)
  }

  async close() {
    return this.inner.close?.()
  }

}