import * as yargs from "yargs"
import { SubtreeConfig } from "./types"
import * as color from "colour"
import { commandAll, commandSingle } from "./lib/commandWrapper"
import { gitSubtreeAdd, gitSubtreeCmd, getSubtrees } from "./lib/gitSubtree"

const commandSingleOrAll = async (
  args: yargs.Arguments,
  handler: (config: SubtreeConfig, treeName: string) => Promise<void>
) => {
  if (args.all) {
    return commandAll(handler, false, false)
  } else {
    if (args._.length < 2) {
      console.error(`Either select --all or a sub-tree name`, args)
    } else {
      return commandSingle(args._[1], handler)
    }
  }
}

yargs
  .usage("$0 [--all] command [options]")
  .describe("all", "apply command to all sub-trees")
  .default("all", false)
  .boolean("all")
  .command("init", "initialize subtrees", {}, async () => {
    return commandAll(gitSubtreeAdd)
  })
  .command(
    "pull",
    "pull from subtree",
    args => {
      // TODO: add an option to pull a specific tag / version
      return args.positional("name", {
        type: "string",
        describe: "sub-tree name"
      })
    },
    async args => {
      const handler = (c: SubtreeConfig, tn: string) =>
        gitSubtreeCmd(c, "pull", tn)
      // TODO: tag the main repo with the version that we got (if it updated)

      // TODO: Write the following message conditionally (only if we actually pulled something)
      console.log(
        "You might need to call `lerna bootstrap` if the sub-tree has updated."
      )
      try {
        return commandSingleOrAll(args, handler)
      } catch (err) {
        console.error(color.red(err))
      }
    }
  )
  .command(
    "push",
    "push to subtree repository",
    yargs => {
      return yargs.positional("name", {
        describe: "sub-tree name",
        default: ""
      })
    },
    async argv => {
      console.log(argv)
      const handler = (c: SubtreeConfig, tn: string) =>
        gitSubtreeCmd(c, "push", tn)
      try {
        return commandSingleOrAll(argv, handler)
      } catch (err) {
        console.error(color.red(err))
      }
    }
  )
  .command("list", "list all subtree names", {}, () => {
    const subtrees = getSubtrees()
    console.log(
      Object.keys(subtrees)
        .map(s => s)
        .join("\n")
    )
    /*
    const numArgsParsed = args._.length + Object.keys(args).length
    console.log(
      "list",
      args,
      numArgsParsed,
      process.argv.slice(numArgsParsed + 2)
    ) */
  })
  .demandCommand(
    1,
    1,
    "at least one command needs to be specified",
    "only command allowed"
  ).argv
