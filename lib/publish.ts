import {
  getUpdatedPackages,
  gitSubtreeCmd,
  commandAll,
  gitChangesPending,
  gitFolderHashes,
  gitTag,
  gitPush,
  gitTagDelete
} from "../common"
import * as color from "colour"
import { gitHashOfCommitRef, getSubtreePackageJson } from "../common"
import { embedRuntime } from "./common"

const embedLernaPublish = (
  argv: ReadonlyArray<string>,
  cwd: string = process.cwd()
) => embedRuntime("lerna", "publish", argv.slice(2), cwd)

export const lernaPublish = async (argv: ReadonlyArray<string>) => {
  if (Object.keys(await getUpdatedPackages()).length === 0) {
    throw new Error(`Nothing to publish -> return`)
  }

  // assert that there are no pending changes
  await gitChangesPending()
  // push all sub-trees that have changed
  await commandAll(async (c, tn) => gitSubtreeCmd(c, "push", tn))

  embedLernaPublish(argv)

  await commandAll(async (c, tn) => {
    // push sub-tree again in order to create a ref that we can tag.
    // TODO: We could actually just split up a new branch...
    await gitSubtreeCmd(c, "push", tn)

    const lastTwoChanges = await gitFolderHashes(c.localFolder, 2)

    const headSha = await gitHashOfCommitRef("HEAD")
    const lastChangeSha = await gitHashOfCommitRef(lastTwoChanges[0])

    if (headSha === lastChangeSha) {
      const lastTwoVersions = await Promise.all(
        lastTwoChanges.map(
          async (ref: string) => (await getSubtreePackageJson(c, ref)).version
        )
      )
      if (lastTwoVersions[0] !== lastTwoVersions[1]) {
        console.log(
          `We have a new version for ${color.green(tn)}: Tagging and pushing!`
        )
        const newVersion = lastTwoVersions[0]
        const newVersionTag = `v${newVersion}`
        console.log(`Creating new tag ${color.green(newVersionTag)} and push`)

        await gitTag(
          newVersionTag,
          `version newVersion`,
          `remotes/${tn}/${c.branch}`
        )

        await gitPush(tn, newVersionTag)

        await gitTagDelete(newVersionTag)
      } else {
        console.log(`${color.yellow(tn)}: no version change: skip tagging`)
      }
    } else {
      console.log(`${color.yellow(tn)}: no new publication, skip tagging`)
    }
  })
}
