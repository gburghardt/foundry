---
layout: post
title: The Foundry Starter Project
categories: blog
---

Starting a Foundry application is easy. Just download a copy of the
[Foundry Starter Project][starter_project], and run a few NodeJS and Bower
commands and you're up and running.

<div class="info">
    <h3>Download The Foundry Starter Project</h3>

    <p class="downloads">
        <a href="https://github.com/gburghardt/foundry-starter-project/archive/master.zip" class="download-zip"
            title="Download The Foundry Starter Project"></a>
    </p>
</div>

### What You'll Need

- NodeJS
- Bower
- Jasmine Rake task

### Getting Started

1. Download the [Starter Project][starter_project] and unzip it to your computer
2. Install the Node dependencies: `npm install`
3. Rename `.bowerrc_example` to `.bowerrc`. This will cause all Bower components
   to be stored in a directory called `vendor`.
4. Install the Bower components: `bower install`
5. Build the example application: `grunt`
6. Configure a web server or virtual host to use the bootstraping project's
   root folder as the public directory in the host.
7. Visit that URL in a web browser

This gives you a generic "Welcome to Foundry" application that does little more
than render a view. It does give you the following features:

- An application file structure
- Basic configs so you can use Dependency Injection
- Dependency settings to use Mustache templates as the view layer
- The files necessary to run Jasmine specs

### Project File Structure

- app/
    - models/
        - welcome.js
    - modules/
        - welcome_module.js
  - views/
      - welcome/
          - index.tpl
- config/
    - files.json
- spec/
    - javascripts/
- vendor/

The `app` directory contains all the JavaScript and template files for your
Foundry application. Inside that is three more directories: `models`, `modules`
and `views`.

Each of the subdirectories are pretty self explanatory. The `views` directory is
where you would place all of your Mustache templates. [Bloodhound][bloodhound]
is used to find the views to render, and it has already been configured to AJAX
in the source code for a view if it does not exist on the page already.

The `config/files.json` file is where the base framework and your application
will be assembled. JavaScript source files are concatenated and minified upon
running `grunt` from the command line, and the results are saved into the
`dist/` directory. Out of the box, the Foundry framework is ~61KB minified.

The `spec/javascripts` directory is where you would place all of your Jasmine
specs. The `vendor` directory is where all the external dependencies are defined
for your application.

[starter_project]: https://github.com/gburghardt/foundry-starter-project/archive/master.zip
[bloodhound]: https://github.com/gburghardt/bloodhound