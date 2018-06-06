#!/usr/bin/env node
import { Subtrees } from "./types"
import * as path from "path"
import * as shell from "shelljs"
import * as escape from "shell-escape"

/* tslint:disable:no-console */

const subtrees: Subtrees = require(path.join(process.cwd(), "subtrees.json"))

Object.keys(subtrees).forEach(st => {
  const command = process.argv[2]
  const args = escape(process.argv.slice(3))
  shell.exec(`gitsbt ${command} ${st} ${args}`)
})
