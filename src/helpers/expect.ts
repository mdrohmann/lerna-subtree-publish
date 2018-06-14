import * as execa from "execa"
import * as fs from "fs"
import * as path from "path"
import { promisify } from "util"

export const getGitDir = async (cwd: string) => {
  if (await promisify(fs.exists)(path.join(cwd, ".git"))) {
    return path.join(cwd, ".git")
  } else {
    return cwd
  }
}

export const expectableCommitTree = async (cwd: string, refs: string[]) => {
  return (await execa.shell(
    `git log --decorate --pretty=format:'commit %d' --graph ${refs.join(" ")}`,
    {
      cwd,
      env: {
        GIT_DIR: await getGitDir(cwd)
      }
    }
  )).stdout
}

export const expectableSubtrees = async (
  cwd: string,
  repositoryBase: string
) => {
  return (await promisify(fs.readFile)(
    path.join(cwd, "subtrees.json"),
    "utf8"
  )).replace(new RegExp(repositoryBase, "g"), "repository")
}
