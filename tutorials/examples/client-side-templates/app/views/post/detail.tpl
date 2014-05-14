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
