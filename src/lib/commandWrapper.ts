import { SubtreeConfig } from "../types"
import { gitChangesPending } from "./git"
import { getSubtrees, getSubtreeConfig } from "./gitSubtree"
import { lastPublishedTag } from "./lastPublishedTag"
import * as color from "colour"

export const asyncExecution = async <I, O>(
  inputs: I[],
  handler: (input: I) => Promise<O>,
  parallel: boolean
): Promise<O[]> => {
  if (parallel) {
    return await Promise.all(inputs.map(handler))
  } else {
    let result: O[] = []
    for (let index = 0; index < inputs.length; ++index) {
      const element = await handler(inputs[index])
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
    Object.keys(subtrees),
    async treeName => {
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
    },
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
