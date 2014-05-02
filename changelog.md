---
layout: default
title: Foundry Changelog
---

## {{ page.title }}

<div class="info">
    <p>Foundry is still under active development. Check back frequently for
        updates</p>
</div>

### October 1, 2013 (Unversioned)

* Adding class dependencies and base framework
* Adding functional demo with all the bells and whistles
* Starting on Wiki documentation

## Versioning, Branches and Tagging

Versions will follow the normal MAJOR.MINOR.PATCH convention.

* 1.0.0 &mdash; Initial release of version 1
* 1.0.1 &mdash; First patch for version 1
* 1.1.0 &mdash; New features that are compatible with the existing
  framework
* 2.0.0 &mdash; Non compatible changes

The branch structure:

* master &mdash; Latest stable build
    * development &mdash; Edge code. Unstable.
    * version/MAJOR.MINOR &mdash; A release branch

For example, the branch for the 1.0 release will be called
`version/1.0`. A feature release will be in a branch called
`version/1.1`.

Tags will be named after the whole version:

* v1.0.0
* v1.0.1
* v1.1.0
* v2.0.0