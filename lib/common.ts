import * as child_process from "child_process"
export const embedRuntime = (
  command: string,
  subCommand: string,
  args: ReadonlyArray<string>,
  cwd: string = process.cwd()
) => {
  child_process.execFileSync(command, [subCommand].concat(args), {
    stdio: "inherit",
    cwd
  })

  if (
    args.length === 1 &&
    (args[0] === "-h" ||
      args[0] === "-v" ||
      args[0] === "--help" ||
      args[0] === "--version")
  ) {
    process.exit(0)
  }
}
