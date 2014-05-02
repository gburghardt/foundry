---
layout: default
title: Integrating Pollyfills With Foundry
---

{% include tutorials/menu.html %}

# {{ page.title }}

<h2 class="intro">
    Foundry was built with newer browsers in mind using the latest HTML5
    technologies. Now we explore how to bolt on support for older browsers using
    the many Pollyfills that are available.
</h2>

<div class="info">
	<p>
		You can view a demo here:
		<a href="{{ site.baseurl }}/tutorials/examples/integrating-pollyfills/">Integrating Pollyfills</a>
	</p>
</div>

In the [previous tutorial][0], we explored how to load modules based on the
current viewport dimensions. We noted that the native `matchMedia` function is
used to enable this feature, but older browsers do not support this. Now it's
time to add support to those older browsers by using a Pollyfill. This tutorial
explains how to seamlessly integrate Pollyfills with Foundry.

## What You'll Need For This Tutorial

1. [Foundry][1]
2. A copy of [yepnope.js][2]
3. A copy of the [matchMedia pollyfill][3] by Paul Irish

## Using `Foundry.pollyfill(...)`

Foundry comes with a method called `pollyfill`, which is used as a generic
wrapper for any pollyfill library. Currently only [yepnope.js][2] is supported,
but it does add support for a true `complete` callback so that Foundry is
initialized only after all pollyfills have been downloaded. First, let's take a
look at the HTML we need:

```html
<body>
	...

	<!-- Base Framework -->
	<script type="text/javascript" src="path/to/yepnope.1.5.4-min.js"></script>
	<script type="text/javascript" src="path/to/foundry.concat.js"></script>
	<script type="text/javascript" src="path/to/foundry/pollyfill_promise.js"></script>
	<script type="text/javascript" src="path/to/foundry/pollyfill_promise/yepnope.js"></script>

	<!-- Your Application Files -->
	<script type="text/javascript" src="./complex_module.js"></script>
	<script type="text/javascript" src="./goldilocks_module.js"></script>
	<script type="text/javascript" src="./mini_module.js"></script>

	<script type="text/javascript">

		var app;

		Foundry
			.pollyfill({
				test: !!window.matchMedia,
				nope: [
					"/js/matchMedia.js",
					"/js/matchMedia.addListener.js"
				]
			})
			.afterAll(function() {
				app = Foundry.run(function(dependencies, options) {
					options.lazyLoadModules = true;
				});
			})
			.start();

	</script>

</body>
```

We need to add references to the yepnope javaScript files, plus we need to
include `pollyfill_promise.js` and `pollyfill_promise/yepnope.js`.

Initializing the application is a little different now, since we must call
`Foundry.pollyfill(...)`. This method returns an instance of
`Foundry.PollyfillPromise`. The `afterAll` callback is executed after all
pollyfills have been downloaded. The `start` method begins the pollyfill
downloads.

It's in the `afterAll` callback that we then call `Foundry.run(...)` to get our
application object.

The call to `Foundry.pollyfill(...)` can receive an unlimited number of yepnope
tests.

```javascript
Foundry
	.pollyfill({
		!!window.matchMedia,
		nope: [ ... ]
	}, {
		test: !!document.documentElement.classList,
		nope: [ ... ]
	}, {
		test: !!document.querySelector,
		nope: "pollyfill/for/querySelector.js"
	})
	.afterAll(function() {
		app = Foundry.run(...);
	})
	.start();
```

__Demo:__ [Integrating Pollyfills]({{ site.baseurl }}/tutorials/examples/integrating-pollyfills/)

Many great pollyfills exist. [HTML5Please.com][4] has a pretty comprehensive
list available.

<ul class="pagination">
    <li class="pagination-back"><a href="{{ site.baseurl }}/tutorials/responsive-modules.html" title="Back: Responsive Modules Using CSS3 Media Queries">Back</a></li>
    <li class="pagination-up"><a href="{{ site.baseurl }}/tutorials/">All Tutorials</a></li>
    <li class="pagination-next"><a href="{{ site.baseurl }}/tutorials/new-modules-on-the-fly.html" title="Next: Creating New Modules On The Fly">Next</a></li>
</ul>

[0]: {{ site.baseurl }}/tutorials/responsive-modules.html
[1]: {{ site.baseurl }}/downloads.html
[2]: http://yepnopejs.com
[3]: https://github.com/paulirish/matchMedia.js/
[4]: http://html5please.com/#polyfill
