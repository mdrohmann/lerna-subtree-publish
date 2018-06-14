#!/usr/bin/env node
import { lernaPublish } from "./lib/publish"
import * as path from "path"
import * as color from "colour"

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

process.env.PATH +=
  path.delimiter + path.join(__dirname, "node_modules", ".bin")

lernaPublish(process.argv)
  .then(() => console.log("done"))
  .catch(error => console.error(color.red(error)))
