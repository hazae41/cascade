import { Result } from "@hazae41/result"

export type Resultable<T, E> = T | Result<T, E>

export namespace Resultable {

  export function okOrThrow<T, E>(result: Resultable<T, E>) {
    if (typeof result !== "object")
      return
    if (result == null)
      return
    if ("isOk" in result && result.isOk())
      return result.get()
    if ("isErr" in result && result.isErr())
      throw result.get()
    return result
  }

}