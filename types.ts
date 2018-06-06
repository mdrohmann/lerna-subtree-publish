export interface Subtrees {
  readonly [name: string]: {
    readonly localFolder: string
    readonly repository: string
    readonly branch: string
  }
}
