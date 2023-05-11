export class StreamError extends Error {

  constructor(cause: unknown) {
    super(undefined, { cause })
  }

  static new(cause: unknown) {
    return new StreamError(cause)
  }

}