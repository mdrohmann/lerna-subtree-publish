import { SubtreeConfig, Subtrees } from "../types"
import * as execa from "execa"
import * as path from "path"
import * as fs from "fs"
import { promisify } from "util"
import { gitGetRemotes, gitRemoteAdd } from "./git"
import * as color from "colour"

// a short shim that I use because shell.exec(..., {silent: true}) believes that
// it does not always return an ExecOutputReturnValue, so it needs an explicit
// cast.
export const getSubtrees = async (
  cwd: string = process.cwd()
): Promise<Subtrees> => {
  try {
    return JSON.parse(
      await promisify(fs.readFile)(path.join(cwd, "subtrees.json"), "utf8")
    )
  } catch (error) {
    throw new Error(
      `subtrees.json file does not exit, or could not be parsed:\n${error}`
    )
  }
}

export const getSubtreePackageJson = async (
  c: SubtreeConfig,
  ref: string = "HEAD",
  cwd: string = process.cwd()
) => {
  const pkgJsonString = await execa.shell(
    `git show ${ref}:${c.localFolder}/package.json`,
    { cwd }
  )
  return JSON.parse(pkgJsonString.stdout)
}

export const gitSubtreeAdd = async (
  config: SubtreeConfig,
  treeName: string,
  cwd: string = process.cwd()
) => {
  const localFolderExists = await (async () => {
    try {
      await promisify(fs.readdir)(path.join(cwd, config.localFolder))
      return true
    } catch (error) {
      return false
    }
  })()
  const remotes = await gitGetRemotes(cwd)
  const remoteExists = remotes.indexOf(treeName) !== -1
  if (remoteExists) {
    console.log(`Remote ${color.yellow(treeName)} already exists`)
  } else {
    await gitRemoteAdd(treeName, config.repository, cwd)
  }
  if (localFolderExists) {
    console.log(
      `Local folder ${color.yellow(config.localFolder)} already exists`
    )
  } else {
    await execa
      .shell(`git fetch ${treeName}`, { cwd })
      .stdout.pipe(process.stdout)

    await execa.shell(
      `git subtree add --prefix=${config.localFolder} ${treeName} ${
        config.branch
      } --squash`,
      { cwd }
    )
  }
}

export const getSubtreeConfig = async (
  treeName: string,
  cwd: string = process.cwd()
) => {
  const subtrees = await getSubtrees(cwd)
  if (subtrees.hasOwnProperty(treeName)) {
    return subtrees[treeName]
  } else {
    console.error(`Unknown subtree ${treeName}`)
    throw new Error(`Unknown subtree ${treeName}`)
  }
}

export const gitSubtreeSplit = async (
  config: SubtreeConfig,
  ref: string = "master",
  cwd: string = process.cwd()
) => {
  const res = execa.shell(
    `git subtree split --prefix=${config.localFolder} ${ref} --squash`,
    { cwd }
  )
  res.stdout.pipe(process.stdout)

  const result = await res

  if (result.code !== 0) {
    throw new Error(`Could not push to ${config.repository}\n:${res.stderr}`)
  }
  return result.stdout
}

export const gitSubtreeCmd = async (
  config: SubtreeConfig,
  command: string,
  treeName: string,
  cwd: string = process.cwd()
) => {
  const res = execa.shell(
    `git subtree ${command} --prefix=${config.localFolder} ${treeName} ${
      config.branch
    } --squash`,
    { cwd }
  )
  res.stdout.pipe(process.stdout)

  const result = await res

  if (result.code !== 0) {
    throw new Error(`Could not push to ${treeName}\n:${res.stderr}`)
  }
}
