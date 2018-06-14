import * as path from "path"
import { Subtrees, SubtreeConfig } from "./types"
import * as execa from "execa"
import * as fs from "fs"
import { promisify } from "util"
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

export interface LernaJson {
  subtreeInitScript?: string
}

export const getLernaJson = async (cwd: string = process.cwd()) => {
  const lernaJsonString = await promisify(fs.readFile)(
    path.join(cwd, "lerna.json"),
    "utf8"
  )
  return JSON.parse(lernaJsonString) as LernaJson
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

export const gitFolderHashes = async (
  folder: string,
  num: number = 1,
  cwd: string = process.cwd()
) => {
  const currentFolderRes = await execa.shell(
    `git log -n ${num} --pretty=format:%h -- ${folder}`,
    { cwd }
  )
  if (currentFolderRes.code !== 0) {
    throw new Error(currentFolderRes.stderr)
  }
  const currentHash = currentFolderRes.stdout.trim()
  return currentHash.split("\n")
}

export const gitTagOfHash = async (
  hash: string,
  match?: string,
  cwd: string = process.cwd()
) => {
  const currentTagRes = await execa.shell(
    `git describe --abbrev=0 ${
      match === undefined ? "" : `--match='${match}*'`
    } ${hash}`,
    { cwd }
  )
  if (currentTagRes.code !== 0) {
    throw Error(
      `Error get tag at hash ${hash} with match ${match}*\n${
        currentTagRes.stderr
      }`
    )
  }
  return currentTagRes.stdout.trim()
}

export const gitTag = async (
  tag: string,
  message: string,
  ref: string = "HEAD",
  cwd: string = process.cwd()
) => {
  await execa.shell(`git tag -a ${tag} -m "${message}" ${ref}`, { cwd })
}

export const gitTagDelete = async (
  tag: string,
  cwd: string = process.cwd()
) => {
  await execa.shell(`git tag -d ${tag}`, { cwd })
}

export const gitInit = async (cwd: string = process.cwd()) => {
  await execa.shell(`git init`, { cwd })
}

export const gitAdd = async (path: string, cwd: string = process.cwd()) => {
  return execa.shell(`git add ${path}`, { cwd })
}

export const gitCommit = async (
  message: string,
  cwd: string = process.cwd()
) => {
  return execa.shell(`git commit -m"${message}"`, { cwd })
}

export const gitPush = async (
  upstream: string,
  ref: string,
  cwd: string = process.cwd()
) => {
  return execa.shell(`git push --follow-tags ${upstream} ${ref}`, { cwd })
}

export const gitHashOfTag = async (
  tag: string,
  cwd: string = process.cwd()
) => {
  const res = await execa.shell(`git rev-list -n 1 --pretty=format:%h ${tag}`, {
    cwd
  })

  if (res.code !== 0) {
    throw new Error(`Could not retrieve SHA of ref ${tag}: ${res.stderr}`)
  }
  return res.stdout
    .trim()
    .split("\n")
    .pop()
}

interface GitRuntimeOptions {
  cwd?: string
  gitDir?: string
}

export const parseGitRuntimeOptions = (rOptions: GitRuntimeOptions) => {
  const res: {
    cwd: string
    env?: { [variable: string]: string }
  } = {
    cwd: rOptions.cwd || process.cwd()
  }
  if (rOptions.gitDir !== undefined) {
    res["env"] = {
      ...process.env,
      GIT_DIR: rOptions.gitDir
    }
  }
  return res
}

export const gitHashOfCommitRef = async (
  ref: string,
  options: GitRuntimeOptions = {}
) => {
  const res = await execa.shell(
    `git rev-parse --short ${ref}`,
    parseGitRuntimeOptions(options)
  )

  if (res.code !== 0) {
    throw new Error(`Could not retrieve SHA of ref ${ref}: ${res.stderr}`)
  }
  return res.stdout.trim()
}

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

export const gitChangesPending = async (cwd: string = process.cwd()) => {
  const res = await execa.shell("git status --porcelain --untracked=no", {
    cwd
  })
  if (res.code !== 0) {
    throw new Error(`could not check for pending changes`)
  }

  if (res.stdout !== "") {
    throw new Error(
      `Working tree has modifications. Sort them out first.\n${res.stdout}`
    )
  }
  return undefined
}

export const gitGetRemotes = async (cwd: string = process.cwd()) => {
  return (await execa.shell("git remote", { cwd })).stdout.split("\n")
}

export const gitRemoteAdd = async (
  treeName: string,
  repository: string,
  cwd: string = process.cwd()
) => execa.shell(`git remote add -f ${treeName} ${repository}`, { cwd })

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

export const commandAll = async (
  handler: (config: SubtreeConfig, treeName: string) => Promise<void>,
  skipCurrentTrees: boolean = false,
  cwd: string = process.cwd()
) => {
  await gitChangesPending(cwd)
  const subtrees = await getSubtrees(cwd)
  await Promise.all(
    Object.keys(subtrees).map(async treeName => {
      if (
        skipCurrentTrees &&
        (await lastPublishedTag(subtrees, treeName, cwd)).current
      ) {
        console.log(
          `Skipping ${color.yellow(treeName)}: Sub-tree has not changed.`
        )
      } else {
        const config = subtrees[treeName]
        await handler(config, treeName)
      }
    })
  )
}

export const commandSingle = async (
  treeName: string,
  handler: (config: SubtreeConfig, treeName: string) => Promise<void>,
  cwd: string = process.cwd()
) => {
  await gitChangesPending(cwd)
  const config = await getSubtreeConfig(treeName, cwd)
  await handler(config, treeName)
}

export const getUpdatedPackages = async (cwd: string = process.cwd()) => {
  try {
    const res = await execa.shell("lerna updated --json", { cwd })
    const updates = res.stdout.toString().trim()
    if (updates === "") {
      return []
    }
    return JSON.parse(updates) as ReadonlyArray<{
      name: string
      version: string
      private: boolean
    }>
  } catch (error) {
    return []
  }
}
