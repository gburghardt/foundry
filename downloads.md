---
layout: default
title: Download Foundry
---

# {{ page.title }}

Since Foundry is currently under heavy development, the latest stable
code is available at [https://github.com/gburghardt/foundry](https://github.com/gburghardt/foundry).

<div class="info">
  <h2>The Foundry Starter Project</h2>

  <p>
    The easiest way to get up and running with Foundy is by cloning or downloading
    the <a href="https://github.com/gburghardt/foundry-starter-project">Foundry Starter Project:
  </p>

  <p class="downloads">
    <a href="https://github.com/gburghardt/foundry-starter-project/archive/master.zip" class="download-zip" title="Download the Foundry Starter Project"></a>
  </p>

  <p>Related Blog Post: <a href="{{ site.baseurl }}{% post_url 2014-05-05-foundry-starter-project %}">The Foundry Starter Project</a>
</div>

## Acquiring Foundry via Git:

Foundry is hosted on GitHub:

    $ git clone https://github.com/gburghardt/foundry.git

## Download Foundry Source Code

<table>
  <thead>
    <tr>
      <th>Version</th>
      <th>Description</th>
      <th>Date</th>
      <th>Download</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Master</td>
      <td>Latest stable build</td>
      <td>...</td>
      <td>
        <a href="https://github.com/gburghardt/foundry/archive/master.zip">Zip</a>
      </td>
    </tr>
    <tr>
      <td>Development</td>
      <td>Latest bug fixes and features. Unstable.</td>
      <td>...</td>
      <td>
        <a href="https://github.com/gburghardt/foundry/archive/development.zip">Zip</a>
      </td>
    </tr>
  </tbody>
</table>

## Installing Foundry Using Bower

Foundry is available as a Bower package as well:

    $ bower install foundry

Or, add Foundry to your dependencies in `bower.json`

```javascript
{
    "dependencies": {
        "foundry": "~0.1"
    }
}
```

Check back frequently for updates.
