#!/usr/bin/env node

import { lernaSplitArgs } from "./lib/create"
import { lernaImport } from "lib/import"

/**
 * - create a new subtree.json entry
 * - creates a tag of type package-name@version if not existent yet.
 */

const res = lernaSplitArgs(process.argv)
if (res.repo === undefined) {
  console.error("need to provide a repository name import")
  process.exit(1)
}
lernaImport(res.name, res.repo as string)
