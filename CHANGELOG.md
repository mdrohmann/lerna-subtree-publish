# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.3.6"></a>
## [1.3.6](https://github.com/mdrohmann/lerna-subtree-publish/compare/v1.3.5...v1.3.6) (2018-06-19)


### Bug Fixes

* **synchronization:** fix the asyncExecution function ([33dbd69](https://github.com/mdrohmann/lerna-subtree-publish/commit/33dbd69))



<a name="1.3.5"></a>
## [1.3.5](https://github.com/mdrohmann/lerna-subtree-publish/compare/v1.3.4...v1.3.5) (2018-06-19)


### Bug Fixes

* **concurrency:** Execute git pull and push commands synchronously ([91919b3](https://github.com/mdrohmann/lerna-subtree-publish/commit/91919b3))



<a name="1.3.4"></a>
## [1.3.4](https://github.com/mdrohmann/lerna-subtree-publish/compare/v1.3.3...v1.3.4) (2018-06-19)


### Bug Fixes

* **lerna-import:** Allow to import repositories that do not (yet) have a package.json file. ([99903cf](https://github.com/mdrohmann/lerna-subtree-publish/commit/99903cf))



<a name="1.3.3"></a>
## [1.3.3](https://github.com/mdrohmann/lerna-subtree-publish/compare/v1.3.2...v1.3.3) (2018-06-18)


### Bug Fixes

* **absolute imports:** remove absolute imports ([c54cc80](https://github.com/mdrohmann/lerna-subtree-publish/commit/c54cc80))



<a name="1.3.2"></a>
## [1.3.2](https://github.com/mdrohmann/lerna-subtree-publish/compare/v1.3.1...v1.3.2) (2018-06-18)


### Bug Fixes

* **typescript:** Fix typescript linting errors ([aa7c128](https://github.com/mdrohmann/lerna-subtree-publish/commit/aa7c128))



<a name="1.3.1"></a>
## [1.3.1](https://github.com/mdrohmann/lerna-subtree-publish/compare/v1.3.0...v1.3.1) (2018-06-18)



<a name="1.3.0"></a>
# [1.3.0](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.2.4...v1.3.0) (2018-06-18)


### Features

* **lerna-import:** Add lerna-import and make lerna-create work as unobstrusively as possible ([b802c10](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/b802c10))



<a name="1.2.4"></a>
## [1.2.4](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.2.3...v1.2.4) (2018-06-14)


### Bug Fixes

* **packaging:** last change has not been uploaded... ([e49b241](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/e49b241))



<a name="1.2.3"></a>
## [1.2.3](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.2.2...v1.2.3) (2018-06-14)


### Bug Fixes

* **lerna-create:** split name of new packge correctly ([f7d953b](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/f7d953b))



<a name="1.2.2"></a>
## [1.2.2](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.2.1...v1.2.2) (2018-06-14)


### Bug Fixes

* **packaging:** Make commonjs module and fix dependencies ([7484609](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/7484609))



<a name="1.2.1"></a>
## [1.2.1](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.2.0...v1.2.1) (2018-06-14)


### Bug Fixes

* **packaging:** Add build files into npm package again. Ooops! ([1454b75](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/1454b75))



<a name="1.2.0"></a>
# [1.2.0](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.1.3...v1.2.0) (2018-06-14)


### Bug Fixes

* **lerna-publish:** Fix lerna-publish by unit testing it ([a59757b](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/a59757b))


### Features

* **lerna-create:** Add a command that creates a new subtree package with a single command ([5d1d6bf](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/5d1d6bf))


### Performance Improvements

* **subtreePush:** Push is run with --no-verify flag whenever possible. ([f8d8fbc](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/f8d8fbc))



<a name="1.1.3"></a>
## [1.1.3](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.1.2...v1.1.3) (2018-06-07)


### Bug Fixes

* **lerna-publish:** Allow lerna-publish to be interactive, push to sub-trees ([7f198cc](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/7f198cc))



<a name="1.1.2"></a>
## [1.1.2](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.1.1...v1.1.2) (2018-06-06)


### Bug Fixes

* **gitsbt-all:** Now it finally works, forgot shebang :( ([1049750](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/1049750))



<a name="1.1.1"></a>
## [1.1.1](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.1.0...v1.1.1) (2018-06-06)


### Bug Fixes

* **packaging:** Add files section, such that JS files are actually packaged. ([9d55179](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/9d55179))



<a name="1.1.0"></a>
# [1.1.0](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.0.4...v1.1.0) (2018-06-06)


### Features

* **gitsbt-all:** Add a command to run gitsbt for all sub-trees. ([cfb7efa](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/cfb7efa))



<a name="1.0.4"></a>
## [1.0.4](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.0.3...v1.0.4) (2018-06-05)



<a name="1.0.2"></a>
## [1.0.2](https://gitlab.com/mcdrohmann/lerna-subtree-publish/compare/v1.0.1...v1.0.2) (2018-06-05)


### Bug Fixes

* **lerna-publish:** Return from script if lerna-publish is called with help or version arguments ([372f26f](https://gitlab.com/mcdrohmann/lerna-subtree-publish/commit/372f26f))
