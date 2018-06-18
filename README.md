# Lerna-subtree-publish

## What you need

For use in a [lerna](lernajs.io) mono repository with the following set-up:

<pre>
lerna.json
package.json
<span style="color:red">subtrees.json</span>
packages/
   a/
      package.json
   b/
      package.json
</pre>

Usually every package is in a separate sub-repository configured as [described here](https://github.com/plitex/git-subtree).

We also assume that you want to use the independent version schema for your
lerna packages.

TODO:

- [ ] Support sub-trees in local folders other than those of the form `packages/name`

## What it does

The `lerna-publish` script from this module does the following:

1.  Runs the regular `lerna publish` command that

    - bumps version numbers of sub-packages,
    - tags the root mono-repository with git tags and
    - creates a changelog in changed packages if configured to do so.

2.  For each subtree repository in `subtrees.json` that has a new version number
    due to the current publish command:

    - Pushes the changes in this subtree repository to the remote repository.
    - Creates and pushes a tag with the version number to the remote repository.
      This way you have your versions tagged in GitHub, GitLab or wherever you
      host them.

## How to use it

- Add the package to the root of your mono repository:

      npm install -D lerna-subtree-publish git-subtree

  or with yarn

      yarn add -D lerna-subtree-publish git-subtree

- Configure your `subtrees.json` and initialize the sub repositories

      ./node_modules/.bin/lerna-subtree init

- Use `./node_modules/.bin/lerna-publish` whenever you want to publish some of
  your changes in sub-tree repositories.

### Creating and importing more packages

You can also add existing repositories with the command

    ./node_modules/.bin/lerna-import packageName --repository repositoryUrl

or create a new subtree-repository with the command

    ./node_modules/.bin/lerna-create packagename --repository
    repositoryUrl

The latter command assumes that you can push to the repositoryUrl either because it will be created on push or because it hosts an empty repository.

### Update the subtrees

`lerna-subtree push` pushes one or all subtree repositories. This skips all the `lerna publish` magic and can be used if you want to contribute upstream to a sub-repository without changing the package version.

`lerna-subtree push` pulls changes downstream from a sub-repository.

TODO:

- [ ] If the version changes during a `lerna-subtree pull` operation, tags should be updated in the root repository.
- [ ] lerna-subtree pull should enable to pull a specific version.

## Troubleshooting

### Missing tag error

You might get the following error when running `lerna publish` or `lerna updated`:

    lerna ERR! initialize caught error
    lerna ERR! Error: fatal: No tags can describe '72e520ee3e663694d92c21ac8cb3dfa0fa1b00fb'.
    lerna ERR! Try --always, or create some tags.

This happens, as with `git-subtree` repositories, you are usually not importing all the tags from your sub-repositories. So, you simply have no git-tags at all in your root repository. Simply run

    git tag v1.0.0

once and you are done.

### Local tags in sub-tree repositories do not show up

This needs to be this way. Git does not allow multiple tags with the same name
in one local repository. Therefore, `git-subtree` does not import the tags from
your remote repositories as they might conflict, and `lerna-subtree-publish`
deletes the tags locally after it pushes them to the remote repository.

However, the `lerna publish` command will create tags of the format
`package@vMA.MI.PA` in the root repository. These tags only show up, if you
create the versions with lerna.
