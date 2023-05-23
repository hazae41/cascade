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
 * `Ok` good errors and `Err` bad ones
 * @param e 
 * @returns 
 */
export function filter(e: unknown): Result<unknown, unknown> {
  if (e instanceof Panic)
    return new Err(e)
  if (e instanceof CatchedError)
    return new Err(e.cause)
  return new Ok(e)
}