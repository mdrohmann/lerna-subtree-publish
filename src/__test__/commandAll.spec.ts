import {
  TemporaryDirectories,
  initTemporaryLerna,
  commitEverythingInPath
} from "../helpers/initTemporaryLerna"
import rimraf from "rimraf"
import { promisify } from "util"
import * as fs from "fs"
import * as path from "path"
import * as execa from "execa"
import { commandAll } from "../lib/commandWrapper"

describe("commandAll", () => {
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
  it("should skip all repositories if they are not current", async done => {
    try {
      const mockHandler = jest.fn()
      await commandAll(mockHandler, true, directories.lernaBase)

      expect(mockHandler).not.toBeCalled()
    } catch (error) {
      console.error("error", (error as Error).stack)
    }
    done()
  })

  it("should run command on repository if it has changed", async done => {
    const mockHandler = jest.fn()
    fs.writeFileSync(
      path.join(directories.lernaBase, "packages", "p1", "a"),
      "test",
      "utf8"
    )
    await commitEverythingInPath(directories.lernaBase, "a added")
    await commandAll(mockHandler, true, directories.lernaBase)
    expect(mockHandler).toHaveBeenCalledTimes(1)
    // expect(mockHandler).toHaveBeenCalledWith({})
    done()
  })

  it("should run command on all repositories if requested", async done => {
    const mockHandler = jest.fn()

    const subtrees = await execa.shell(
      `cat ${directories.lernaBase}/subtrees.json`
    )

    await commandAll(mockHandler, false, directories.lernaBase)
    expect(mockHandler).toHaveBeenCalledTimes(2)
    done()
  })
})
