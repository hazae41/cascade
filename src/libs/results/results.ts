import { Result } from "@hazae41/result"

export namespace Results {

  export function okOrThrow<T>(result?: Result<T, unknown>) {
    if (result == null)
      return
    if (result.isOk())
      return result.get()
    throw result.get()
  }

}