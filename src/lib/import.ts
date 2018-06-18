import { gitChangesPending, gitAdd, gitCommit } from "./git"
import { getSubtrees, gitSubtreeAdd } from "./gitSubtree"
import * as path from "path"
import { promisify } from "util"
import * as fs from "fs"
import mkdirp from "mkdirp-promise"
import { SubtreeConfig } from "types"

export const lernaImport = async (
  name: string,
  repository: string,
  cwd: string = process.cwd()
) => {
  await gitChangesPending(cwd)

  const subtreesJsonOld = await (async () => {
    try {
      return await getSubtrees(cwd)
    } catch (error) {
      return {}
    }
  })()

  if (subtreesJsonOld.hasOwnProperty(name)) {
    throw new Error(`A subtree with name ${name} already exists.`)
  }

  const localFolder = path.join("packages", name)
  const packagePath = path.join(cwd, localFolder)

  if (await promisify(fs.exists)(packagePath)) {
    throw new Error(`Cannot import ${name}, package path already exists.`)
  }

  await mkdirp(path.dirname(packagePath))

  const config: SubtreeConfig = {
    branch: "master",
    repository,
    localFolder
  }

  // import the repository
  await gitSubtreeAdd(config, name, true, cwd)

  const newSubtrees = {
    ...subtreesJsonOld,
    [name]: config
  }

  await promisify(fs.writeFile)(
    path.join(cwd, "subtrees.json"),
    JSON.stringify(newSubtrees, null, 2),
    "utf8"
  )

  await gitAdd("subtrees.json", cwd)
  await gitCommit(`imported subtree package ${name}`, cwd)
}
