export class StreamError extends Error {
  readonly #class = StreamError
  readonly name = this.#class.name

  static from(cause: unknown) {
    return new StreamError(undefined, { cause })
  }

}

export class ControllerError extends Error {
  readonly #class = ControllerError
  readonly name = this.#class.name

  static from(cause: unknown) {
    return new ControllerError(undefined, { cause })
  }

}