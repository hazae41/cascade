import { Err } from "@hazae41/result"

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
 * `Err` good errors and throw bad ones
 * @param error 
 * @returns `Err(error)` if not `CatchedError` 
 * @throws `error` if `CatchedError` 
 */
export function rethrow(error: unknown) {
  if (error instanceof CatchedError)
    throw error.cause
  return new Err(error)
}