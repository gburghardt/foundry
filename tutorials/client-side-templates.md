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
    <p>
        You can view the demo here:
        <a href="{{ site.baseurl }}/tutorials/examples/client-side-templates/">Rendering Client Side Templates With Foundry</a>
    </p>
</div>

The next major leap for a web application is to take on the responsibility of
rendering data into HTML. A plethora of templating solutions are available for
JavaScript, each with their own advantages and disadvantages. This tutorial will
focus on one of the most popular ones:
[Mustache Templates][0].

## What You'll Need For This Tutorial

1. [Foundry]({{ site.baseurl }}/downloads.html)
2. Basic knowledge of [Dependency Injection with Foundry]({{ site.baseurl }}/tutorials/dependency-injection.html)
3. A fresh copy of [Mustache.js][0]
4. A fresh copy of [Bloodhound][1]
5. A fresh copy of [Promise][2]

## What You'll Learn

- How to configure the dependencies for [Bloodhound][1]
- How to render views in modules

## Boilerplate HTML

First, let's start with the HTML we'll need to render a blog post, and its
comments using Mustache.js templates.

```html
<!DOCTYPE HTML>
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="x-ua-compatible" content="edge">
        <title>Demo: Rendering Client Side Templates &mdash; Foundry</title>
    </head>
    <body>

        <div data-modules="postDetail" data-module-options='{"post_id": 1}'>Loading ...</div>

        <!-- Base Framework -->
        <script type="text/javascript" src="/js/foundry/v0.1.1/foundry.concat.js"></script>

        <!-- Client Side Template Libs -->
        <script type="text/javascript" src="/js/mustache.js/mustache.js"></script>
        <script type="text/javascript" src="/js/promise/src/promise.js"></script>
        <script type="text/javascript" src="/js/bloodhound/src/bloodhound.js"></script>
        <script type="text/javascript" src="/js/bloodhound/src/bloodhound/adapters/mustache_template.js"></script>
        <script type="text/javascript" src="/js/bloodhound/src/bloodhound/rendering_engines/dynamic_rendering_engine.js"></script>
        <script type="text/javascript" src="/js/bloodhound/src/bloodhound/view_providers/mustache_view_provider.js"></script>
        <script type="text/javascript" src="/js/bloodhound/src/bloodhound/view_resolvers/dynamic_view_resolver.js"></script>

        <!-- Application Files -->
        <script type="text/javascript" src="./post_detail_module.js"></script>
    </body>
</html>
```

Most of the HTML is nothing new for Foundry. We have seven additional JavaScript
files for Mustache.js and Bloodhound. Bloodhound is a view resolver for
JavaScript that decouples the rendering of a view from the process of loading
all the necessary templates. We will configure Bloodhound to use Mustache.js as
the template language. Next we'll configure Foundry to use Bloodhound as the
view resolver:

```html
<body>
    ...

    <!-- Application Files -->
    <script type="text/javascript" src="./post_detail_module.js"></script>

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
                        container: "document",
                        provider: "viewProvider",
                        templateUrlBase: { value: "{{ site.baseurl }}/tutorials/examples/client-side-templates" }
                    }
                },
                renderingEngine: {
                    type: "Bloodhound.RenderingEngines.DynamicRenderingEngine",
                    singleton: true,
                    properties: {
                        viewResolver: "viewResolver"
                    }
                },
                postDetail: {
                    type: "PostDetailModule",
                    parent: "module"
                }
            });

            // All modules will have this rendering engine available
            dependencies.module.properties.renderingEngine = "renderingEngine";
        });

    </script>
</body>
```

## Creating A Module That Renders A View

Now let's create the `PostDetailModule` class:

<h3 class="code-label">Contents of post_detail_module.js</h3>

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

We will just use a hard coded JSON file called `1.json`:

<h3 class="code-label">Contents of 1.json</h3>

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

/tutorials/examples/client-side-templates/<strong>post/detail</strong>.tpl

<h3 class="code-label">post/detail.tpl</h3>

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

<h3 class="code-label">post/comments.tpl</h3>

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
