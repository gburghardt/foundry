---
layout: default
title: Rendering Client Side Templates
---

{% include tutorials/menu.html %}

# {{ page.title }}

<h2 class="intro">
    Turn client side templates into HTML using Mustache templates and a View
    Resolver allowing your application to render data agnostic of the template
    language underneath.
</h2>

<div class="info">
    <h3>Download The Demo</h3>

    <p class="downloads">
        <a href="{{ site.baseurl }}/tutorials/examples/client-side-templates.zip" class="download-zip"
            title="Download &ldquo;Client Side Templates&rdquo; Demo as a ZIP file"></a>
    </p>

    <p>
        View The Demo:
        <a href="{{ site.baseurl }}/tutorials/examples/client-side-templates/">Client Side Templates</a>
    </p>
</div>

The next major leap for a web application is to take on the responsibility of
rendering data into HTML. A plethora of templating solutions are available for
JavaScript, each with their own advantages and disadvantages. This tutorial will
focus on one of the most popular ones:
[Mustache Templates][0].

## What You'll Need For This Tutorial

1. The [Foundry Starter Project][starter_project]
2. Basic knowledge of [Dependency Injection with Foundry]({{ site.baseurl }}/tutorials/dependency-injection.html)
3. A fresh copy of [Mustache.js][0]
4. A fresh copy of [Bloodhound][1]
5. A fresh copy of [Promise][2]

## What You'll Learn

- How to configure the dependencies for [Bloodhound][1]
- How to render views in modules

## Creating A Module That Renders A View

Let's create a `PostDetailModule` class, which you will save in
`app/modules/post_detail_module.js`:

<h3 class="code-label">app/modules/post_detail_module.js</h3>

```javascript
var PostDetailModule = Module.Base.extend({
    prototype: {

        options: {
            post_id: 0,
            view: "post/detail"
        },

        _ready: function() {
            Module.Base.prototype._ready.call(this);

            var xhr = new XMLHttpRequest(),
                data = null,
                that = this;

            xhr.onreadystatechange = function() {
                if (this.readyState < 4 || this.status < 200 || this.status > 299) {
                    return;
                }

                data = JSON.parse(this.responseText);
                that._show(data);
            };

            xhr.open("GET", "./" + this.options.post_id + ".json");
            xhr.send(null);
        },

        _show: function(data) {
            this.render(this.options.view, data.post, this.element)
                .done(function() {
                    this._loaded();
                }, this);
        }

    }
});
```

The `_ready` method just makes an AJAX request to get some JSON data. It then
calls the `_show` method, which is where Mustache.js and Bloodhound come into
play.

Each module has a method called `render`, which takes three arguments:

1. `view` (String): The name of a view to render
2. `data` (Object): The data to render
3. `elementOrId` (HTMLElement|String): An HTML element or Id in which the
   rendered HTML source should be placed.

The return value of `render` depends on the Bloodhound rendering engine you
configure your application to use. We are using
`Bloodhound.RenderingEngines.DynamicRenderingEngine`, which pulls in template
source code via Ajax if it cannot find the template on the current web page.
Because of this, rendering is an asynchronous operation, so the `render` method
returns a `Bloodhound.RenderPromise` object. The `done` callback is invoked
after all templates and sub templates have been downloaded and rendered.

## The Data To Render

We will just use a hard coded JSON file in `app/data/1.json`:

<h3 class="code-label">app/data/1.json</h3>

```javascript
{
    "post": {
        "id": 1,
        "title": "Rendering Client Side Templates With Foundry",
        "date": "04/20/2014",
        "author": "Wilbur, the Grunt",
        "body": "<p>It's easy to render client side templates!</p>",
        "tags": [
            "javascript",
            "foundry",
            "templates",
            "mustache"
        ],
        "comments": [{
            "id": 1,
            "post_id": 1,
            "author": "Anonymous Coward",
            "text": "This is terrible!"
        }, {
            "id": 2,
            "post_id": 1,
            "author": "John Doe",
            "text": "No it's not!"
        }, {
            "id": 3,
            "post_id": 1,
            "author": "Jane Doe",
            "text": "Witty retort!"
        }, {
            "id": 4,
            "post_id": 1,
            "author": "Anonymous Coward",
            "text": "Smack talk!"
        }]
    }
}
```

It has basic info about a blog post, as well as lists of tags and comments. Next
we will see how Bloodhound automates the loading of partials in Mustache.js.

## Creating The Mustache.js Templates

We will have two templates to create. The first one shows the whole blog post.
Inside that is a Mustache.js partial that renders the comments. In our module,
the name of the view we render is in `this.options.view`, which is equal to
`post/detail`. Bloodhound auto generates a URL from this:

app/views/<strong>post/detail</strong>.tpl

<h3 class="code-label">app/views/post/detail.tpl</h3>

```html
{% raw %}
<div class="post" id="ost-{{id}}">
    <h1>{{title}}</h1>
    <p class="date">{{date}}</p>
    <p>By {{author}}</p>

    {{{body}}}

    <p>Tags:
        {{#tags}}
            <a href="/tags/{{.}}">{{.}}</a>
        {{/tags}}
    </p>

    {{> post/comments}}
</div>
{% endraw %}
```

Here we see {% raw %}`{{> post/comments}}`{% endraw %}, which will cause Bloodhound to fetch a
template named `post/comments` and render that as a partial in Mustache.js:

<h3 class="code-label">app/views/post/comments.tpl</h3>

```html
{% raw %}
<ol class="comments">
    {{#comments}}
        <li id="post-{{post_id}}-comment-{{id}}">
            {{text}} &mdash; {{author}}
        </li>
    {{/comments}}
</ol>
{% endraw %}
```

## Adding The Post Detail Module To The Page

Open up `index.html`. Add a dependency config for the PostDetailModule you just
created called "postDetail":

<h3 class="code-label">index.html</h3>

```html
<body>
    ...

    <script type="text/javascript">
        var app = Foundry.run(function(dependencies, options) {
            dependencies.merge({
                viewProvider: {
                    type: "Bloodhound.ViewProviders.MustacheViewProvider",
                    singleton: true
                },
                viewResolver: {
                    type: "Bloodhound.ViewResolvers.DynamicViewResolver",
                    singleton: true,
                    properties: {
                        container: { value: "views" },
                        provider: "viewProvider",
                        templateUrlBase: { value: "./app/views" }
                    }
                },
                renderingEngine: {
                    type: "Bloodhound.RenderingEngines.DynamicRenderingEngine",
                    singleton: true,
                    properties: {
                        viewResolver: "viewResolver"
                    }
                },

                // Your modules go here
                postDetail: {
                    type: "PostDetailModule",
                    parent: "module"
                }
            });

            dependencies.module.properties.renderingEngine = "renderingEngine";

            options.lazyLoadModules = true;
        });
    </script>
```

Next, just after the opening `<body>` tag place the following DIV tag:

```html
<body>
    <div data-modules="postDetail" data-module-options='{"post_id": 1}'></div>
```

That's all it takes to wire up Mustache.js to Foundry. If you switch out the
`viewProvider` in the dependency configs, you can change to any other template
language you want to use. Since we are using
`Bloodhound.ViewResolvers.DynamicViewResolver`, templates are downloaded on
demand and cached for later use. Your web page does not need the source code for
all of its views to be included in the web page source.

__Demo:__ [Rendering Client Side Templates With Foundry]({{ site.baseurl }}/tutorials/examples/client-side-templates/)

## A Quick Recap

In this tutorial we learned how to configure Foundry to use a view resolver, and
then configure the view resolver to use Mustach.js templates. Lastly we learned
about the `render` method that all modules have allowing you to render a view.

## Up Next: Unit Testing Foundry Applications

Any good framework worth its weight in salt is testable with Unit Tests. Foundry
is no exception. Learn how to unit test your Foundry application using Jasmine
in the next tutorial.

<ul class="pagination">
    <li class="pagination-back"><a href="{{ site.baseurl }}/tutorials/dependency-injection.html" title="Back: Dependency Injection With Foundry">Back</a></li>
    <li class="pagination-up"><a href="{{ site.baseurl }}/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="{{ site.baseurl }}/tutorials/unit-testing.html" title="Next: Unit Testing Foundry Applications">Next</a></li>
</ul>

[0]: https://github.com/janl/mustache.js
[1]: https://github.com/gburghardt/bloodhound
[2]: https://github.com/gburghardt/promise
[starter_project]: {{ site.baseurl }}{% post_url 2014-05-05-foundry-starter-project %}
