import { Subtrees } from "../types"
import { gitFolderHashes, gitTagOfHash, gitHashOfTag } from "./git"
import { getSubtreePackageJson } from "./gitSubtree"

/**
 * return the git hash and tag of the latest publication of a package at a given
 * sub-tree
 * @param subtrees subtree definitions
 * @param treeName the sub-tree to look for
 */
export const lastPublishedTag = async (
  subtrees: Subtrees,
  treeName: string,
  cwd: string = process.cwd()
) => {
  const config = subtrees[treeName]
  const currentHash = (await gitFolderHashes(config.localFolder, 1, cwd))[0]

  const pkgName = (await getSubtreePackageJson(config, "HEAD", cwd)).name

  const currentTag = await (async () => {
    // first try to get a tag that resolves to pkgName@version
    try {
      const res = await gitTagOfHash(currentHash, pkgName, cwd)
      return res
    } catch (err) {
      return gitTagOfHash(currentHash, undefined, cwd)
    }
  })()

  const currentTagHash = await gitHashOfTag(currentTag, cwd)

  return {
    tag: currentTag,
    hash: currentTagHash,
    current: currentTagHash === currentHash
  }
}
