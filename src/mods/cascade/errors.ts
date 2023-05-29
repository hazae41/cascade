/**
 * Error returned from `tryEnqueue`, `tryError`, `tryClose`, `tryTerminate`
 */
export class ControllerError extends Error {
  readonly #class = ControllerError
  readonly name = this.#class.name

  static from(cause: unknown) {
    return new ControllerError(undefined, { cause })
  }

}