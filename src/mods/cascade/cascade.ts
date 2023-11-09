import { Err, Ok, Result } from "@hazae41/result"
import { ControllerError } from "./errors.js"

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

export class WriteError extends Error {
  readonly #class = WriteError
  readonly name = this.#class.name

  static from(cause: unknown) {
    return new WriteError(undefined, { cause })
  }

}

export interface Writable<W> {
  write(chunk?: W): Promise<void>
}

export async function tryWrite<W>(writer: Writable<W>, chunk?: W): Promise<Result<void, WriteError>> {
  try {
    return new Ok(await writer.write(chunk))
  } catch (e: unknown) {
    return new Err(WriteError.from(e))
  }
}

export class Writer<T> {

  constructor(
    readonly inner: WritableStreamDefaultWriter<T>
  ) { }

  static from<T>(writable: WritableStream<T>) {
    return new Writer(writable.getWriter())
  }

  [Symbol.dispose]() {
    this.inner.releaseLock()
  }

}


