import { Err, Ok, Panic, Result } from "@hazae41/result"

/**
 * Error passed to `controller.error()` or returned from `start`, `pull`, `write`, `transform`, `flush`, `cancel`, `abort`, `close`
 */
export class StreamError extends Error {
  readonly #class = StreamError
  readonly name = this.#class.name

  static from(cause: unknown) {
    return new StreamError(undefined, { cause })
  }

  static okOrFromAndThrow<T>(result: Result<T, unknown>) {
    if (result.isOk())
      return result.get()
    throw StreamError.from(result.get())
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
 * `Ok` good errors and `Err` bad ones
 * @param error 
 * @returns 
 */
export function filter(error: unknown): Result<unknown, unknown> {
  if (error instanceof Panic)
    return new Err(error)
  if (error instanceof CatchedError)
    return new Err(error.cause)
  return new Ok(error)
}

/**
 * Throw `result.inner` if `Err`, return `Err(result.inner)` if `Ok`
 * @param result 
 * @returns 
 */
export function rethrow(result: Result<unknown, unknown>) {
  if (result.isOk())
    return new Err(result.get())
  throw result.get()
}