import { Err, Ok, Result } from "@hazae41/result"
import { Promiseable } from "libs/promises/promiseable.js"
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

export async function runWithWriter<W>(writable: WritableStream<W>, callback: (writer: WritableStreamDefaultWriter<W>) => Promiseable<void>) {
  const writer = writable.getWriter()

  try {
    return await callback(writer)
  } finally {
    writer.releaseLock()
  }
}

export function runWithWriterSync<W>(writable: WritableStream<W>, callback: (writer: WritableStreamDefaultWriter<W>) => void) {
  const writer = writable.getWriter()

  try {
    return callback(writer)
  } finally {
    writer.releaseLock()
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

export async function tryWrite<W>(writer: WritableStreamDefaultWriter<W>, chunk?: W): Promise<Result<void, WriteError>> {
  try {
    return new Ok(await writer.write(chunk))
  } catch (e: unknown) {
    return new Err(WriteError.from(e))
  }
}