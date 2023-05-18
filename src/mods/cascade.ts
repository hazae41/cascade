import { Err, Ok, Result } from "@hazae41/result"
import { StreamControllerError } from "./error.js"

export interface Enqueueable<T> {
  enqueue(chunk?: T): void
}

export function tryEnqueue<T>(enqueueable: Enqueueable<T>, chunk?: T): Result<void, StreamControllerError> {
  try {
    return new Ok(enqueueable.enqueue(chunk))
  } catch (e: unknown) {
    return new Err(new StreamControllerError(e))
  }
}

export interface Errorable {
  error(reason?: unknown): void
}

export function tryError(errorable: Errorable, reason?: unknown): Result<void, StreamControllerError> {
  try {
    return new Ok(errorable.error(reason))
  } catch (e: unknown) {
    return new Err(new StreamControllerError(e))
  }
}

export interface Closeable {
  close(): void
}

export function tryClose(closeable: Closeable): Result<void, StreamControllerError> {
  try {
    return new Ok(closeable.close())
  } catch (e: unknown) {
    return new Err(new StreamControllerError(e))
  }
}

export interface Terminateable {
  terminate(): void
}

export function tryTerminate(terminateable: Terminateable): Result<void, StreamControllerError> {
  try {
    return new Ok(terminateable.terminate())
  } catch (e: unknown) {
    return new Err(new StreamControllerError(e))
  }
}