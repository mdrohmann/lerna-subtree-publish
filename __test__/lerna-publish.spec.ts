import {
  initTemporaryLerna,
  commitEverythingInPath,
  LERNA_ROOT_NAME
} from "../helpers/initTemporaryLerna"
import * as path from "path"
import * as fs from "fs"
import rimraf from "rimraf"
import { gitSubtreeAdd, commandAll } from "../common"
import { gitHashOfCommitRef } from "../common"
import { TemporaryDirectories } from "../helpers/initTemporaryLerna"
import { promisify } from "util"
import { expectableCommitTree } from "../helpers/expect"
import { lernaPublish } from "../lib/publish"

describe("lerna-publish", () => {
  let directories: TemporaryDirectories

  beforeAll(async done => {
    directories = await initTemporaryLerna(2)
    done()
  })

  afterAll(async done => {
    try {
      await promisify(rimraf)(directories.path)
    } catch (err) {
      console.error("what is going on here? ", err)
    }
    done()
  })

  it("should initialize the remote repositories correctly", async done => {
    await commandAll(
      async (c, tn) => gitSubtreeAdd(c, tn, directories.lernaBase),
      false,
      directories.lernaBase
    )
    const packagesHead = await Promise.all(
      [1, 2].map(p =>
        gitHashOfCommitRef(`remotes/p${p}/master`, {
          cwd: directories.lernaBase
        })
      )
    )

    const packagesRemoteHead = await Promise.all(
      [1, 2].map(p =>
        gitHashOfCommitRef("HEAD", {
          gitDir: path.join(directories.path, "remotes", `p${p}`)
        })
      )
    )

    expect(packagesHead).toEqual(packagesRemoteHead)

    expect(
      await expectableCommitTree(directories.lernaBase, ["master"])
    ).toMatchSnapshot()

    /*
    const lernaHead = await gitHashOfCommitRef("HEAD", {
      cwd: directories.lernaBase
    })
    const lernaRemoteHead = await gitHashOfCommitRef("HEAD", {
      gitDir: path.join(directories.path, "remotes", LERNA_ROOT_NAME)
    })
    expect(lernaHead).toEqual(lernaRemoteHead)
    */

    done()
  })

  it("should do nothing if nothing has changed", async done => {
    const treeBefore = await expectableCommitTree(directories.lernaBase, [
      "master",
      "p1/master",
      "p2/master"
    ])
    await lernaPublish(
      ["", "", "--cd-version", "major", "--yes"],
      directories.lernaBase
    )
    const treeAfter = await expectableCommitTree(directories.lernaBase, [
      "master",
      "p1/master",
      "p2/master"
    ])
    expect(treeBefore).toEqual(treeAfter)
    done()
  })

  it("should do the lerna publish work and tag remote sub-tree repository", async done => {
    fs.writeFileSync(
      path.join(directories.lernaBase, "packages", "p1", "a"),
      "test",
      "utf8"
    )
    await commitEverythingInPath(directories.lernaBase, "a added")
    await lernaPublish(
      ["", "", "--cd-version", "major", "--yes"],
      directories.lernaBase
    )

    expect(
      await expectableCommitTree(directories.lernaBase, ["master", "p1/master"])
    ).toMatchSnapshot()

    expect(
      await expectableCommitTree(path.join(directories.repositoryBase, "p1"), [
        "master"
      ])
    ).toMatchSnapshot()

    expect(
      await expectableCommitTree(
        path.join(directories.repositoryBase, LERNA_ROOT_NAME),
        ["master"]
      )
    ).toMatchSnapshot()
    done()
    // make sure that gitsbt commands are only run on sub-repos that have changed since publication
    // make sure prepush and precomit hooks are run only once.
  })
})
