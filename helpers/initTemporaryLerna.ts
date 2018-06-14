import * as tmp from "tmp"
import { promisify } from "util"
import * as fs from "fs"
import * as path from "path"
import * as execa from "execa"
import { SubtreeConfig } from "types"
import { gitTag, gitRemoteAdd, gitPush } from "../common"
import { lernaCreate } from "../lib/create"

export const LERNA_ROOT_NAME = "lerna-tmp-root"

export const makeSubtrees = (
  repositoryBase: string,
  packageNames: ReadonlyArray<string>
) =>
  packageNames.reduce<{
    [name: string]: SubtreeConfig
  }>((p, n) => {
    p[n] = {
      localFolder: path.join("packages", n),
      branch: "master",
      repository: path.join(repositoryBase, n)
    }
    return p
  }, {})

export const initTemporaryDirectory = () => {
  return new Promise<{ path: string; cleanupCallback: () => void }>(
    (resolve, reject) => {
      tmp.dir((err, path, cleanupCallback) => {
        if (err) {
          return reject(err)
        }
        return resolve({
          path,
          cleanupCallback
        })
      })
    }
  )
}

export const initLernaJson = async (directory: string) => {
  await promisify(fs.writeFile)(
    path.join(directory, "lerna.json"),
    JSON.stringify({
      lerna: "2.11.0",
      packages: ["packages/*"],
      version: "independent"
    }),
    "utf8"
  )
}

export const initPackageJson = async (
  directory: string,
  name: string = "lerna-tmp-example"
) => {
  await promisify(fs.writeFile)(
    path.join(directory, "package.json"),
    JSON.stringify({
      version: "1.0.0",
      name,
      private: true
    })
  )
}

export const initSubPackage = async (directory: string) => {
  try {
    await promisify(fs.mkdir)(directory)
  } catch (err) {}
  await initPackageJson(directory, path.basename(directory))
}

export interface TemporaryDirectories {
  lernaBase: string
  path: string
  repositoryBase: string
}

export const initTemporaryLerna = async (
  numPackets: number
): Promise<TemporaryDirectories> => {
  const tempDir = await initTemporaryDirectory()

  const baseDir = path.join(tempDir.path, "lerna")

  fs.mkdirSync(baseDir)

  // init lerna.json
  await initLernaJson(baseDir)

  // init package.json
  await initPackageJson(baseDir)

  fs.mkdirSync(path.join(baseDir, "packages"))

  const packageIndices = [...Array(numPackets).keys()].map(x => x + 1)

  // set up temporary repositories
  const repositoryBase = path.join(tempDir.path, "remotes")
  fs.mkdirSync(repositoryBase)

  await initTemporaryBareRepository(repositoryBase, LERNA_ROOT_NAME)
  await Promise.all(
    packageIndices.map(p =>
      initTemporaryBareRepository(repositoryBase, `p${p}`)
    )
  )

  // make initial git commit
  await initializeAndPushLernaRepository(baseDir, repositoryBase)

  try {
    // init sub-packages (one after the other)
    for (let i = 0; i < packageIndices.length; ++i) {
      const p = packageIndices[i]
      await lernaCreate(
        `p${p}`,
        path.join(repositoryBase, `p${p}`),
        ["--yes"],
        baseDir
      )
    }
  } catch (err) {
    console.error("error creating packages", err)
  }

  /*
  // write subtrees.json
  const packages = packageIndices.map(p => `p${p}`)
  const subtrees = makeSubtrees(repositoryBase, packages)

  fs.writeFileSync(
    path.join(baseDir, "subtrees.json"),
    JSON.stringify(subtrees)
  )
  */

  return {
    path: tempDir.path,
    repositoryBase,
    lernaBase: baseDir
  }
}

export const initTemporaryBareRepository = async (
  baseDir: string,
  name: string
) => {
  const repositoryPath = path.join(baseDir, name)
  await promisify(fs.mkdir)(repositoryPath)
  return execa.shell(`git init --bare`, { cwd: repositoryPath })
}

export const commitEverythingInPath = async (
  directory: string,
  message: string
) => {
  await execa.shell(`git add *`, { cwd: directory })
  return execa.shell(`git commit -m"${message}"`, { cwd: directory })
}

export const initializeAndPushLernaRepository = async (
  lernaBase: string,
  repositoryBase: string
) => {
  await execa.shell("git init", { cwd: lernaBase })
  await commitEverythingInPath(lernaBase, "initial")
  // tag it
  await gitTag("v1", "version 1", "HEAD", lernaBase)
  // add origin
  await gitRemoteAdd(
    "origin",
    path.join(repositoryBase, LERNA_ROOT_NAME),
    lernaBase
  )
  // and push
  await gitPush("origin", "HEAD", lernaBase)
}
