import * as path from "path"
import { promisify } from "util"
import * as fs from "fs"
import * as execa from "execa"
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
