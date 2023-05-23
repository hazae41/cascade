import { Panic, Result } from "@hazae41/result"

/**
 * Error passed to `controller.error()` or returned from `start`, `pull`, `write`, `transform`, `flush`, `cancel`, `abort`, `close`
 */
export class StreamError extends Error {
  readonly #class = StreamError
  readonly name = this.#class.name

  static from(cause: unknown) {
    return new StreamError(undefined, { cause })
  }

  static fromAndUnwrap<T>(result: Result<T, unknown>) {
    return result.mapErrSync(StreamError.from).unwrap()
  }

}

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

/**
 * Error catched by `start`, `pull`, `write`, `transform`, `flush`, `cancel`, `abort`, `close`
 */
export class CatchedError extends Error {
  readonly #class = CatchedError
  readonly name = this.#class.name

  static from(cause: unknown) {
    return new CatchedError(undefined, { cause })
  }

  static fromAndThrow(cause: unknown): never {
    throw CatchedError.from(cause)
  }

}

/**
 * Throw bad errors and return good ones
 * @param e 
 * @returns 
 */
export function rethrow<T>(e: T) {
  if (e instanceof Panic)
    throw e
  if (e instanceof CatchedError)
    throw e.cause
  return e as Exclude<T, Panic | CatchedError>
}