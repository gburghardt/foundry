---
layout: default
title: Official Foundry Blog
---

## Foundry Blog

<ol class="posts">
{% for post in site.posts %}
	<li>
		<h3><a href="{{ site.baseurl }}/{{ post.url }}">{{ post.title }}</a></h3>
		{{ post.excerpt }}
	</li>
{% endfor %}
</ol>