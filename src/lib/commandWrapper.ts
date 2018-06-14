import { SubtreeConfig } from "../types"
import { gitChangesPending } from "./git"
import { getSubtrees, getSubtreeConfig } from "./gitSubtree"
import { lastPublishedTag } from "./lastPublishedTag"
import * as color from "colour"

export const commandAll = async (
  handler: (config: SubtreeConfig, treeName: string) => Promise<void>,
  skipCurrentTrees: boolean = false,
  cwd: string = process.cwd()
) => {
  await gitChangesPending(cwd)
  const subtrees = await getSubtrees(cwd)
  await Promise.all(
    Object.keys(subtrees).map(async treeName => {
      if (
        skipCurrentTrees &&
        (await lastPublishedTag(subtrees, treeName, cwd)).current
      ) {
        console.log(
          `Skipping ${color.yellow(treeName)}: Sub-tree has not changed.`
        )
      } else {
        const config = subtrees[treeName]
        await handler(config, treeName)
      }
    })
  )
}

export const commandSingle = async (
  treeName: string,
  handler: (config: SubtreeConfig, treeName: string) => Promise<void>,
  cwd: string = process.cwd()
) => {
  await gitChangesPending(cwd)
  const config = await getSubtreeConfig(treeName, cwd)
  await handler(config, treeName)
}
