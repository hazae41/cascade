import { Err, Ok, Result } from "@hazae41/result"
import { ControllerError, StreamError } from "./errors.js"

export function unthrow(e: unknown): Result<never, StreamError> {
  if (e instanceof StreamError)
    return new Err(e)
  throw e
}

export interface Enqueueable<T> {
  enqueue(chunk?: T): void
}

export function tryEnqueue<T>(enqueueable: Enqueueable<T>, chunk?: T): Result<void, ControllerError> {
  try {
    return new Ok(enqueueable.enqueue(chunk))
  } catch (e: unknown) {
    return new Err(ControllerError.from(e))
  }
}

export interface Errorable {
  error(reason?: unknown): void
}

export function tryError(errorable: Errorable, reason?: unknown): Result<void, ControllerError> {
  try {
    return new Ok(errorable.error(reason))
  } catch (e: unknown) {
    return new Err(ControllerError.from(e))
  }
}

export interface Closeable {
  close(): void
}

export function tryClose(closeable: Closeable): Result<void, ControllerError> {
  try {
    return new Ok(closeable.close())
  } catch (e: unknown) {
    return new Err(ControllerError.from(e))
  }
}

export interface Terminateable {
  terminate(): void
}

export function tryTerminate(terminateable: Terminateable): Result<void, ControllerError> {
  try {
    return new Ok(terminateable.terminate())
  } catch (e: unknown) {
    return new Err(ControllerError.from(e))
  }
}