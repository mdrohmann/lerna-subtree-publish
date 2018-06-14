import * as tmp from "tmp"
import { promisify } from "util"
import * as fs from "fs"
import * as path from "path"
import * as execa from "execa"
import { SubtreeConfig } from "types"
import { gitTag, gitRemoteAdd, gitPush } from "../common"

export const LERNA_ROOT_NAME = "lerna-tmp-root"

export const makeSubtrees = (
  repoBase: string,
  packageNames: ReadonlyArray<string>
) =>
  packageNames.reduce<{
    [name: string]: SubtreeConfig
  }>((p, n) => {
    p[n] = {
      localFolder: path.join("packages", n),
      branch: "master",
      repository: path.join(repoBase, n)
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
  repoBase: string
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

  // init sub-packages
  await Promise.all(
    packageIndices.map(
      async p => await initSubPackage(path.join(baseDir, "packages", `p${p}`))
    )
  )

  // set up temporary repositories
  const repoBase = path.join(tempDir.path, "remotes")
  fs.mkdirSync(repoBase)

  await initTemporaryBareRepository(repoBase, LERNA_ROOT_NAME)
  await Promise.all(
    packageIndices.map(p => initTemporaryBareRepository(repoBase, `p${p}`))
  )

  // write subtrees.json
  const packages = packageIndices.map(p => `p${p}`)
  const subtrees = makeSubtrees(repoBase, packages)

  fs.writeFileSync(
    path.join(baseDir, "subtrees.json"),
    JSON.stringify(subtrees)
  )

  // make initial git commit
  await initializeAndPushLernaRepo(baseDir, repoBase)

  return {
    path: tempDir.path,
    repoBase,
    lernaBase: baseDir
  }
}

export const initTemporaryBareRepository = async (
  baseDir: string,
  name: string
) => {
  const repoPath = path.join(baseDir, name)
  await promisify(fs.mkdir)(repoPath)
  return execa.shell(`git init --bare`, { cwd: repoPath })
}

export const commitEverythingInPath = async (
  directory: string,
  message: string
) => {
  await execa.shell(`git add *`, { cwd: directory })
  return execa.shell(`git commit -m"${message}"`, { cwd: directory })
}

export const initializeAndPushLernaRepo = async (
  lernaBase: string,
  repoBase: string
) => {
  await execa.shell("git init", { cwd: lernaBase })
  await commitEverythingInPath(lernaBase, "initial")
  // tag it
  await gitTag("v1", "version 1", "HEAD", lernaBase)
  // add origin
  await gitRemoteAdd("origin", path.join(repoBase, LERNA_ROOT_NAME), lernaBase)
  // and push
  await gitPush("origin", "HEAD", lernaBase)
}
