import * as color from "colour"
import { embedRuntime } from "./common"
import {
  gitChangesPending,
  gitFolderHashes,
  gitHashOfCommitRef,
  gitTag,
  gitPush,
  gitTagDelete
} from "./git"
import { getUpdatedPackages } from "./lerna"
import { commandAll } from "./commandWrapper"
import { gitSubtreeSplit, getSubtreePackageJson } from "./gitSubtree"

const embedLernaPublish = (
  argv: ReadonlyArray<string>,
  cwd: string = process.cwd()
) => embedRuntime("lerna", "publish", argv.slice(2), cwd)

export const lernaPublish = async (
  argv: ReadonlyArray<string>,
  cwd: string = process.cwd()
) => {
  if (Object.keys(await getUpdatedPackages(cwd)).length === 0) {
    console.error("Nothing to publish!")
    return
  }

  // assert that there are no pending changes
  await gitChangesPending(cwd)

  // TODO: make sure we run the prepush hooks (probably lernaPublish will take
  // care of that...)
  /*
  // push all sub-trees that have changed
  await commandAll(
    async (c, tn) => {
      await gitSubtreeCmd(c, "push", tn, cwd)
    },
    true,
    cwd
  )
  */

  embedLernaPublish(argv, cwd)

  await commandAll(
    async (c, tn) => {
      const lastTwoChanges = await gitFolderHashes(c.localFolder, 2, cwd)

      const headSha = await gitHashOfCommitRef("HEAD", { cwd })
      const lastChangeSha = await gitHashOfCommitRef(lastTwoChanges[0], { cwd })

      if (headSha === lastChangeSha) {
        // this package is affected by the publication, so split it up and
        // eventually push it, but first check if we have to tag it too.
        const splitHash = await gitSubtreeSplit(c, "", cwd)

        const lastTwoVersions = await Promise.all(
          lastTwoChanges.map(
            async (ref: string) =>
              (await getSubtreePackageJson(c, ref, cwd)).version
          )
        )
        if (lastTwoVersions[0] !== lastTwoVersions[1]) {
          console.log(
            `We have a new version for ${color.green(
              tn
            )}: Tag it before pushing!`
          )
          const newVersion = lastTwoVersions[0]
          const newVersionTag = `v${newVersion}`

          await gitTag(newVersionTag, `version newVersion`, splitHash, cwd)

          await gitPush(tn, `${splitHash}:refs/heads/${c.branch}`, true, cwd)

          await gitTagDelete(newVersionTag, cwd)
        } else {
          console.log(`${color.yellow(tn)}: no version change: skip tagging`)
          // we still need to push, this can happen if our version dependencies have changed...
          // TODO: Test this code branch
          await gitPush(tn, `${splitHash}:refs/heads/${c.branch}`, true, cwd)
        }
      } else {
        console.log(`${color.yellow(tn)}: no new publication, skip tagging`)
      }
    },
    false,
    cwd
  )
}
