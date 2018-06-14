import * as execa from "execa"

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
  noVerify: boolean = false,
  cwd: string = process.cwd()
) => {
  return execa.shell(
    `git push ${
      noVerify ? "--no-verify" : ""
    } --follow-tags ${upstream} ${ref}`,
    { cwd }
  )
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
