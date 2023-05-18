export class StreamError extends Error {
  readonly #class = StreamError

  constructor(cause: unknown) {
    super(undefined, { cause })
  }

  static new(cause: unknown) {
    return new StreamError(cause)
  }

}

export class StreamControllerError extends Error {
  readonly #class = StreamControllerError

  constructor(cause: unknown) {
    super(undefined, { cause })
  }

  static new(cause: unknown) {
    return new StreamControllerError(cause)
  }

}