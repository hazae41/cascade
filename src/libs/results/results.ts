import { Result } from "@hazae41/result"

export type Resultable<T, E> = T | Result<T, E>