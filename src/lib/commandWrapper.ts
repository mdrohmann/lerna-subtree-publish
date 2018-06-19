import { SubtreeConfig } from "../types"
import { gitChangesPending } from "./git"
import { getSubtrees, getSubtreeConfig } from "./gitSubtree"
import { lastPublishedTag } from "./lastPublishedTag"
import * as color from "colour"

export const asyncExecution = async <T>(
  tasks: Promise<T>[],
  parallel: boolean
): Promise<T[]> => {
  if (parallel) {
    return await Promise.all(tasks)
  } else {
    let result: T[] = []
    for (let index = 0; index < tasks.length; index++) {
      const element = await tasks[index]
      result.push(element)
    }
    return result
  }
}

export const commandAll = async (
  handler: (config: SubtreeConfig, treeName: string) => Promise<void>,
  skipCurrentTrees: boolean = false,
  parallel: boolean = true,
  cwd: string = process.cwd()
) => {
  await gitChangesPending(cwd)
  const subtrees = await getSubtrees(cwd)
  await asyncExecution(
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
    }),
    parallel
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
