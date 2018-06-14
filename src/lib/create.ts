import { embedRuntime } from "./common"
import * as path from "path"
import { SubtreeConfig } from "../types"
import * as fs from "fs"
import { promisify } from "util"
import * as execa from "execa"
import rimraf from "rimraf"
import mkdirp from "mkdirp-promise"
import {
  gitChangesPending,
  gitInit,
  gitRemoteAdd,
  gitPush,
  gitAdd,
  gitCommit,
  gitTag
} from "./git"
import { getSubtrees, gitSubtreeAdd, getSubtreePackageJson } from "./gitSubtree"
import { getLernaJson } from "./lerna"

const embedNpmInit = (
  argv: ReadonlyArray<string>,
  cwd: string = process.cwd()
) => embedRuntime("npm", "init", argv, cwd)

export const parseRemotes = () => {}

export const lernaSplitArgs = (argv: ReadonlyArray<string>) => {
  if (argv.length < 3) {
    throw new Error(`You need to specify a package name`)
  }

  const repoIndex = argv.findIndex(x => x === "--repository")
  const repo = repoIndex === -1 ? undefined : argv[repoIndex + 1]
  const newArgv =
    repoIndex === -1
      ? argv.slice(3)
      : argv.slice(3, repoIndex).concat(argv.slice(repoIndex + 2))

  return {
    name: argv[3],
    repo,
    argv: newArgv
  }
}

export const lernaCreate = async (
  name: string,
  repository: string,
  initArgs: ReadonlyArray<string>,
  cwd: string = process.cwd()
) => {
  // assert that there are no pending changes
  await gitChangesPending(cwd)

  const subtreesJsonExists = await promisify(fs.exists)(
    path.join(cwd, "subtrees.json")
  )

  const oldSubtrees = subtreesJsonExists ? await getSubtrees(cwd) : {}
  // Assert that name is not taken yet.
  if (oldSubtrees.hasOwnProperty(name)) {
    throw new Error(`A subtree with name ${name} already exists.`)
  }
  const localFolder = path.join("packages", name)
  const packagePath = path.join(cwd, localFolder)

  if (await promisify(fs.exists)(packagePath)) {
    throw new Error(`A package already exists under ${localFolder}`)
  }

  // ensure that packagePath exists
  await mkdirp(packagePath)

  // TODO: maybe we should allow to create the packages in other folders
  embedNpmInit(initArgs, packagePath)

  // make it private by default
  const packageJsonFile = path.join(packagePath, "package.json")
  const packageJson = JSON.parse(
    await promisify(fs.readFile)(packageJsonFile, "utf8")
  )
  await promisify(fs.writeFile)(
    packageJsonFile,
    JSON.stringify(
      {
        ...packageJson,
        private: true
      },
      null,
      2
    ),
    "utf8"
  )

  const config: SubtreeConfig = {
    localFolder,
    repository,
    branch: "master"
  }

  /* add the remote repository...
  console.log("npm init")
  await gitSubtreeAdd(config, name, cwd)
  */

  const lernaJson = await getLernaJson(cwd)
  if (lernaJson.subtreeInitScript !== undefined) {
    await execa.shell(`${lernaJson.subtreeInitScript}`, {
      cwd,
      env: {
        ...process.env,
        REPOSITORY: repository,
        PACKAGE_NAME: name
      }
    })
  }

  // We cannot just push changes to create repo... We need to use subtree add at
  // some point..., so we have to
  const result = await (async () => {
    try {
      // * initialize a dummy git repo here
      await gitInit(packagePath)
      // * make an initial commit
      await execa.shell(`git add .`, { cwd: packagePath })
      await execa.shell('git commit -m"initial commit"', { cwd: packagePath })
      // * add origin and push
      await gitRemoteAdd("origin", repository, packagePath)
      const res = await gitPush("origin", "HEAD", true, packagePath)
      return {
        okay: res.code === 0,
        error: res.stderr
      }
    } catch (error) {
      return {
        okay: false,
        error
      }
    }
  })()
  // clean up the git repository.
  await promisify(rimraf)(path.join(packagePath, ".git"))

  if (!result.okay) {
    throw new Error(
      `Error pushing to new repository ${repository}.\nYou can re-run this command later, when you know how to fix the error:\n${
        result.error
      }`
    )
  }

  // Here, we can be sure that the remote repo is pushed, so we:
  // * delete the package folder
  await promisify(rimraf)(packagePath)
  // * add and it as a subtree repo
  // * update subtrees.json
  const newSubtrees = {
    ...oldSubtrees,
    [name]: config
  }
  await promisify(fs.writeFile)(
    path.join(cwd, "subtrees.json"),
    JSON.stringify(newSubtrees, null, 2),
    "utf8"
  )
  await gitAdd("subtrees.json", cwd)
  await gitCommit(`add subtree package ${name}`, cwd)

  // * add the package back
  await gitSubtreeAdd(config, name, cwd)

  // TODO: I believe that this should go into gitSubtreeAdd...
  const version = (await getSubtreePackageJson(config, "HEAD", cwd)).version
  const tag = `${name}@${version}`
  await gitTag(tag, `Add package ${name} with version ${version}`, "HEAD", cwd)
  await gitPush("origin", "HEAD", true, cwd)
}
