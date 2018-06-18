import {
  initTemporaryLerna,
  TemporaryDirectories
} from "../helpers/initTemporaryLerna"
import { promisify } from "util"
import rimraf from "rimraf"
import { lernaCreate } from "../lib/create"
import * as lc from "../lib/common"
import * as fs from "fs"
import * as path from "path"
import * as execa from "execa"
import mkdirp from "mkdirp-promise"
import { expectableCommitTree, expectableSubtrees } from "../helpers/expect"
import { getLernaJson } from "../lib/lerna"
import { gitPush } from "../lib/git"
import inquirer from "inquirer"

describe("lerna-create", () => {
  let directories: TemporaryDirectories
  let embedRuntimeSpy: jest.SpyInstance

  beforeAll(async done => {
    directories = await initTemporaryLerna(0)
    embedRuntimeSpy = jest.spyOn(lc, "embedRuntime")
    /*
    embedRuntimeSpy.mockImplementation((_, __, ___, cwd: string) => {
      fs.writeFileSync(
        path.join(cwd, "package.json"),
        JSON.stringify({
          name: "name"
        }),
        "utf8"
      )
    })
    */
    done()
  })

  afterAll(async done => {
    try {
      await promisify(rimraf)(directories.path)
    } catch (err) {
      console.error(`Something went wrong during delete of ${directories.path}`)
    }
    embedRuntimeSpy.mockRestore()
    done()
  })

  it("should return if name exists already and user prompts no", async done => {
    let promptSpy: jest.SpyInstance
    promptSpy = jest.spyOn(inquirer, "prompt")
    promptSpy.mockResolvedValue({ proceed: false })
    try {
      await mkdirp(path.join(directories.lernaBase, "packages", "p1"))
      await lernaCreate("p1", "invalid", ["--yes"], directories.lernaBase)
      expect(true).toBe(true)
    } catch (error) {
      console.log(error)
      expect(false).toBe(true)
    }
    promptSpy.mockRestore()
    done()
  })

  it("should throw an error if something goes wrong during git repository creation", async () => {
    try {
      await lernaCreate("p2", "invalid", ["--yes"], directories.lernaBase)
      expect(true).toBe(false)
    } catch (error) {
      expect(error.toString()).toMatch(
        "'invalid' does not appear to be a git repository"
      )
    }
  })

  it("should throw an error if it cannot push to remote repo", async () => {
    try {
      await lernaCreate(
        "p3",
        "git@invalid:invalid",
        ["--yes"],
        directories.lernaBase
      )
      expect(true).toBe(false)
    } catch (error) {
      expect(error.toString()).toMatch("Error pushing to new repository")
    }
  })
  it("should create a new sub-tree package", async () => {
    const lernaJson = await getLernaJson(directories.lernaBase)
    fs.writeFileSync(
      path.join(directories.lernaBase, "lerna.json"),
      JSON.stringify(
        {
          ...lernaJson,
          subtreeInitScript: "git init --bare ${REPOSITORY}"
        },
        null,
        2
      ),
      "utf8"
    )
    await execa.shell(`git add .`, { cwd: directories.lernaBase })
    await execa.shell('git commit -m"update lerna.json"', {
      cwd: directories.lernaBase
    })

    try {
      await lernaCreate(
        "p4",
        path.join(directories.repositoryBase, "p4"),
        ["--yes"],
        directories.lernaBase
      )
      expect(true).toBe(true)

      await gitPush("origin", "master", true, directories.lernaBase)

      expect(
        await expectableCommitTree(directories.lernaBase, [
          "master",
          "p4/master"
        ])
      ).toMatchSnapshot()
      expect(
        await expectableSubtrees(
          directories.lernaBase,
          directories.repositoryBase
        )
      ).toMatchSnapshot()
    } catch (error) {
      console.error(error)
      expect(true).toBe(false)
    }
    // some-how fake the call of npm init
    // ensure that subtree.json is updated
  })
})
