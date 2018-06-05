#!/usr/bin/env node
import * as path from "path"
import * as shell from "shelljs"
import * as escape from "shell-escape"

/**
 * This script can be used just like the `lerna publish` command.
 *
 * All arguments are forwarded to that command.  However, once done, it checks
 * if any of the packages from repositories in git-subtree managed modules
 * defined in `subtrees.json` have a new version.  In case, a new version
 * exists, a temporary (local) tag is created and pushed to the remote
 * repository.
 *
 * This way new versions are tagged remotely.  This allows us to use commit-ish
 * tags to require special versions of packages.  Yay!
 */

// tslint:disable:no-console
interface Subtrees {
  readonly [name: string]: {
    readonly localFolder: string
    readonly repository: string
    readonly branch: string
  }
}

const lernaArgs = escape(process.argv.slice(2))

const res = shell.exec(`lerna publish ${lernaArgs}`)
if (res.code !== 0) {
  process.exit(res.code)
}

// a short shim that I use because shell.exec(..., {silent: true}) believes that
// it does not always return an ExecOutputReturnValue, so it needs an explicit
// cast.
const shellExecSilent = (cmd: string): shell.ExecOutputReturnValue =>
  shell.exec(cmd, { silent: true }) as shell.ExecOutputReturnValue

// tslint:disable-next-line:no-var-requires
const subtrees: Subtrees = require(path.join(process.cwd(), "subtrees.json"))

Object.keys(subtrees).forEach(s => {
  const config = subtrees[s]
  const res = shellExecSilent(
    `git log -n 2 --pretty=format:%h -- ${config.localFolder}`
  )

  if (res.code !== 0) {
    console.error(
      `Could not find the last two changes in ${config.localFolder}: ${
        res.stderr
      }`
    )
    return
  }
  const lastTwoChangesToSubtree = res.stdout.split("\n")

  const resHeadRev = shellExecSilent(`git rev-parse HEAD`)

  if (
    resHeadRev.code === 0 &&
    resHeadRev.stdout ===
      shellExecSilent(`git rev-parse ${lastTwoChangesToSubtree[0]}`).stdout
  ) {
    const lastTwoVersions = lastTwoChangesToSubtree.map((c: string) => {
      const res = shellExecSilent(
        `git show ${c}:${config.localFolder}/package.json`
      )
      if (res.code !== 0) {
        console.error(`Could not parse the version in package.json`)
        return ""
      }
      return JSON.parse(res.stdout).version
    })

    if (lastTwoVersions[0] !== lastTwoVersions[1]) {
      console.log(`We have a new version for ${s}: Tagging and pushing!`)
      // We have a new version.  So, we have to tag and push
      const newVersion = lastTwoVersions[0]
      console.log(`create new tag v${newVersion} and push`)

      if (
        shellExecSilent(
          `git tag -a v${newVersion} -m"version ${newVersion}" remotes/${s}/${
            config.branch
          }`
        ).code !== 0
      ) {
        console.error(
          `could not tag remote branch ${s}/${
            config.branch
          } with tag v${newVersion}`
        )
        return
      }
      if (shellExecSilent(`git push ${s} v${newVersion}`).code !== 0) {
        console.error(
          `could not push the version tag v${newVersion} to remote branch ${s}`
        )
      }
      // clean-up (remove the version tag locally)
      if (shellExecSilent(`git tag -d v${newVersion}`).code !== 0) {
        console.error(`could not remove the tag v${newVersion} locally`)
      }
    } else {
      console.log(`${s}: no version change`)
    }
  } else {
    console.log(`${s}: latest commit did not affect us`)
  }
})
