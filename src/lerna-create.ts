#!/usr/bin/env node
import { lernaCreate, lernaSplitArgs } from "./lib/create"

/**
 * - creates a new package,
 * - updates the subtrees.json file with a sub-tree
 * - if configured, runs a script that creates an empty remote repository
 * - pushes to the new remote end
 */

const res = lernaSplitArgs(process.argv)
if (res.repo === undefined) {
  console.error("need to provide a repository name")
  process.exit(1)
}
lernaCreate(res.name, res.repo as string, res.argv)
