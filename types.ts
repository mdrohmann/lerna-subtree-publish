export interface SubtreeConfig {
  readonly localFolder: string
  readonly repository: string
  readonly branch: string
}
export interface Subtrees {
  readonly [name: string]: SubtreeConfig
}
