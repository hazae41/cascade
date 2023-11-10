import { Err, Ok, Result } from "@hazae41/result"

export type Resultable<T, E> = T | Result<T, E>

export namespace Resultable {

  export function okOrThrow<T, E>(result: Resultable<T, E>) {
    if (result instanceof Ok)
      return result.get()
    if (result instanceof Err)
      throw result.get()
    return result
  }

}