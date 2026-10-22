import { type ru } from './ru'

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>
}

// Same key tree as ru.ts with any string values: a missing or extra key
// in another language fails type-checking.
export type Translation = Widen<typeof ru>
