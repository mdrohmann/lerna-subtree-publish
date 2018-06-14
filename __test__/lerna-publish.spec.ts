import {
  initTemporaryLerna,
  initTemporaryBareRepository,
  commitEverythingInPath,
  makeSubtrees,
  LERNA_ROOT_NAME,
  initializeAndPushLernaRepo
} from "../helpers/initTemporaryLerna"
import * as path from "path"
import * as fs from "fs"
import rimraf from "rimraf"
import { gitSubtreeAdd, commandAll } from "../common"
import { gitHashOfCommitRef } from "../common"
import { TemporaryDirectories } from "../helpers/initTemporaryLerna"
import { promisify } from "util"

describe("lerna-publish", () => {
  var directories: TemporaryDirectories

  beforeAll(async () => {
    const res = await initTemporaryLerna(2)
    directories = res
  })

  afterAll(async () => {
    try {
      console.log("deleting temporary directory...")
      await promisify(rimraf)(directories.path)
    } catch (err) {
      console.error("what is going on here? ", err)
    }
    console.log("done rimraffing")
  })

  describe("commandAll", () => {
    it("should skip all repos if they are not current", async () => {
      try {
        const mockHandler = jest.fn()
        await commandAll(mockHandler, true, directories.lernaBase)

        console.log("test done 0")
        expect(mockHandler).not.toBeCalled()
        console.log("test done")
      } catch (error) {
        console.error("error", (error as Error).stack)
      }
    })

    it("should run command on repo if it has changed", async () => {
      const mockHandler = jest.fn()
      fs.writeFileSync(
        path.join(directories.lernaBase, "packages", "p1", "a"),
        "test",
        "utf8"
      )
      await commitEverythingInPath(directories.lernaBase, "a added")
      await commandAll(mockHandler, true, directories.lernaBase)
      expect(mockHandler).toHaveBeenCalledTimes(1)
    })

    it("should run command on all repos if requested", async () => {
      const mockHandler = jest.fn()

      await commandAll(mockHandler, false, directories.lernaBase)
      expect(mockHandler).toHaveBeenCalledTimes(2)
    })
  })
  it("should initialize the remote repos correctly", async () => {
    // this does not work yet, because the packages/directories should be
    // fetched from the remote, or be created with lerna-create(!)
    await commandAll(
      async (c, tn) => gitSubtreeAdd(c, tn, directories.lernaBase),
      false,
      directories.lernaBase
    )
    const lernaHead = await gitHashOfCommitRef("HEAD", {
      cwd: directories.lernaBase
    })
    const packagesHead = await Promise.all(
      [1, 2].map(p =>
        gitHashOfCommitRef(`remotes/p${p}/master`, {
          cwd: directories.lernaBase
        })
      )
    )

    const lernaRemoteHead = await gitHashOfCommitRef("HEAD", {
      gitDir: path.join(directories.path, "remotes", LERNA_ROOT_NAME)
    })

    const packagesRemoteHead = await Promise.all(
      [1, 2].map(p =>
        gitHashOfCommitRef("HEAD", {
          gitDir: path.join(directories.path, "remotes", `p${p}`)
        })
      )
    )

    expect(lernaHead).toEqual(lernaRemoteHead)
    expect(packagesHead).toEqual(packagesRemoteHead)
  })

  it.skip("should do nothing if nothing has changed", () => {
    console.log("yo")
  })

  it.skip("should publish a change in a sub-repo with Changelog, tag and remote sub-tree tag", () => {
    // make sure that gitsbt commands are only run on sub-repos that have changed since publication
    // make sure prepush and precomit hooks are run only once.
  })

  it.skip("should publish changes for two sub-repos", () => {
    console.log("yo")
  })
})
