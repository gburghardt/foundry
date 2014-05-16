/*! foundry 2014-05-16 */
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (root, factory) {
  if (typeof exports === "object" && exports) {
    factory(exports); // CommonJS
  } else {
    var mustache = {};
    factory(mustache);
    if (typeof define === "function" && define.amd) {
      define(mustache); // AMD
    } else {
      root.Mustache = mustache; // <script>
    }
  }
}(this, function (mustache) {

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var nonSpaceRe = /\S/;
  var eqRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var RegExp_test = RegExp.prototype.test;
  function testRegExp(re, string) {
    return RegExp_test.call(re, string);
  }

  function isWhitespace(string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var Object_toString = Object.prototype.toString;
  var isArray = Array.isArray || function (object) {
    return Object_toString.call(object) === '[object Array]';
  };

  function isFunction(object) {
    return typeof object === 'function';
  }

  function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  function escapeTags(tags) {
    if (!isArray(tags) || tags.length !== 2) {
      throw new Error('Invalid tags: ' + tags);
    }

    return [
      new RegExp(escapeRegExp(tags[0]) + "\\s*"),
      new RegExp("\\s*" + escapeRegExp(tags[1]))
    ];
  }

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all template text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices
   * in the original template of the token, respectively.
   *
   * Tokens that are the root node of a subtree contain two more elements: an
   * array of tokens in the subtree and the index in the original template at which
   * the closing tag for that section begins.
   */
  function parseTemplate(template, tags) {
    tags = tags || mustache.tags;
    template = template || '';

    if (typeof tags === 'string') {
      tags = tags.split(spaceRe);
    }

    var tagRes = escapeTags(tags);
    var scanner = new Scanner(template);

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length) {
          delete tokens[spaces.pop()];
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(tagRes[0]);
      if (value) {
        for (var i = 0, len = value.length; i < len; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push(['text', chr, start, start + 1]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n') {
            stripSpace();
          }
        }
      }

      // Match the opening tag.
      if (!scanner.scan(tagRes[0])) break;
      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(eqRe);
        scanner.scan(eqRe);
        scanner.scanUntil(tagRes[1]);
      } else if (type === '{') {
        value = scanner.scanUntil(new RegExp('\\s*' + escapeRegExp('}' + tags[1])));
        scanner.scan(curlyRe);
        scanner.scanUntil(tagRes[1]);
        type = '&';
      } else {
        value = scanner.scanUntil(tagRes[1]);
      }

      // Match the closing tag.
      if (!scanner.scan(tagRes[1])) {
        throw new Error('Unclosed tag at ' + scanner.pos);
      }

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection) {
          throw new Error('Unopened section "' + value + '" at ' + start);
        }
        if (openSection[1] !== value) {
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
        }
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        tagRes = escapeTags(tags = value.split(spaceRe));
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();
    if (openSection) {
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
    }

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens(tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      switch (token[0]) {
      case '#':
      case '^':
        collector.push(token);
        sections.push(token);
        collector = token[4] = [];
        break;
      case '/':
        section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (match && match.index === 0) {
      var string = match[0];
      this.tail = this.tail.substring(string.length);
      this.pos += string.length;
      return string;
    }

    return "";
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var index = this.tail.search(re), match;

    switch (index) {
    case -1:
      match = this.tail;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context(view, parentContext) {
    this.view = view == null ? {} : view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function (name) {
    var value;
    if (name in this.cache) {
      value = this.cache[name];
    } else {
      var context = this;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;

          var names = name.split('.'), i = 0;
          while (value != null && i < names.length) {
            value = value[names[i++]];
          }
        } else {
          value = context.view[name];
        }

        if (value != null) break;

        context = context.parent;
      }

      this.cache[name] = value;
    }

    if (isFunction(value)) {
      value = value.call(this.view);
    }

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer() {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null) {
      tokens = cache[template] = parseTemplate(template, tags);
    }

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function (tokens, context, partials, originalTemplate) {
    var buffer = '';

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    var self = this;
    function subRender(template) {
      return self.render(template, context, partials);
    }

    var token, value;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      switch (token[0]) {
      case '#':
        value = context.lookup(token[1]);
        if (!value) continue;

        if (isArray(value)) {
          for (var j = 0, jlen = value.length; j < jlen; ++j) {
            buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
          }
        } else if (typeof value === 'object' || typeof value === 'string') {
          buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
        } else if (isFunction(value)) {
          if (typeof originalTemplate !== 'string') {
            throw new Error('Cannot use higher-order sections without the original template');
          }

          // Extract the portion of the original template that the section contains.
          value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

          if (value != null) buffer += value;
        } else {
          buffer += this.renderTokens(token[4], context, partials, originalTemplate);
        }

        break;
      case '^':
        value = context.lookup(token[1]);

        // Use JavaScript's definition of falsy. Include empty arrays.
        // See https://github.com/janl/mustache.js/issues/186
        if (!value || (isArray(value) && value.length === 0)) {
          buffer += this.renderTokens(token[4], context, partials, originalTemplate);
        }

        break;
      case '>':
        if (!partials) continue;
        value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
        if (value != null) buffer += this.renderTokens(this.parse(value), context, partials, value);
        break;
      case '&':
        value = context.lookup(token[1]);
        if (value != null) buffer += value;
        break;
      case 'name':
        value = context.lookup(token[1]);
        if (value != null) buffer += mustache.escape(value);
        break;
      case 'text':
        buffer += token[1];
        break;
      }
    }

    return buffer;
  };

  mustache.name = "mustache.js";
  mustache.version = "0.8.1";
  mustache.tags = [ "{{", "}}" ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function (template, view, partials) {
    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.
  mustache.to_html = function (template, view, partials, send) {
    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

}));

// yepnope.js
// Version - 1.5.4pre
//
// by
// Alex Sexton - @SlexAxton - AlexSexton[at]gmail.com
// Ralph Holzmann - @ralphholzmann - ralphholzmann[at]gmail.com
//
// http://yepnopejs.com/
// https://github.com/SlexAxton/yepnope.js/
//
// Tri-license - WTFPL | MIT | BSD
//
// Please minify before use.
// Also available as Modernizr.load via the Modernizr Project
//
( function ( window, doc, undef ) {

var docElement            = doc.documentElement,
    sTimeout              = window.setTimeout,
    firstScript           = doc.getElementsByTagName( "script" )[ 0 ],
    toString              = {}.toString,
    execStack             = [],
    started               = 0,
    noop                  = function () {},
    // Before you get mad about browser sniffs, please read:
    // https://github.com/Modernizr/Modernizr/wiki/Undetectables
    // If you have a better solution, we are actively looking to solve the problem
    isGecko               = ( "MozAppearance" in docElement.style ),
    isGeckoLTE18          = isGecko && !! doc.createRange().compareNode,
    insBeforeObj          = isGeckoLTE18 ? docElement : firstScript.parentNode,
    // Thanks to @jdalton for showing us this opera detection (by way of @kangax) (and probably @miketaylr too, or whatever...)
    isOpera               = window.opera && toString.call( window.opera ) == "[object Opera]",
    isIE                  = !! doc.attachEvent && !isOpera,
    strJsElem             = isGecko ? "object" : isIE  ? "script" : "img",
    strCssElem            = isIE ? "script" : strJsElem,
    isArray               = Array.isArray || function ( obj ) {
      return toString.call( obj ) == "[object Array]";
    },
    isObject              = function ( obj ) {
      return Object(obj) === obj;
    },
    isString              = function ( s ) {
      return typeof s == "string";
    },
    isFunction            = function ( fn ) {
      return toString.call( fn ) == "[object Function]";
    },
    globalFilters         = [],
    scriptCache           = {},
    prefixes              = {
      // key value pair timeout options
      timeout : function( resourceObj, prefix_parts ) {
        if ( prefix_parts.length ) {
          resourceObj['timeout'] = prefix_parts[ 0 ];
        }
        return resourceObj;
      }
    },
    handler,
    yepnope;

  /* Loader helper functions */
  function isFileReady ( readyState ) {
    // Check to see if any of the ways a file can be ready are available as properties on the file's element
    return ( ! readyState || readyState == "loaded" || readyState == "complete" || readyState == "uninitialized" );
  }


  // Takes a preloaded js obj (changes in different browsers) and injects it into the head
  // in the appropriate order
  function injectJs ( src, cb, attrs, timeout, /* internal use */ err, internal ) {
    var script = doc.createElement( "script" ),
        done, i;

    timeout = timeout || yepnope['errorTimeout'];

    script.src = src;

    // Add our extra attributes to the script element
    for ( i in attrs ) {
        script.setAttribute( i, attrs[ i ] );
    }

    cb = internal ? executeStack : ( cb || noop );

    // Bind to load events
    script.onreadystatechange = script.onload = function () {

      if ( ! done && isFileReady( script.readyState ) ) {

        // Set done to prevent this function from being called twice.
        done = 1;
        cb();

        // Handle memory leak in IE
        script.onload = script.onreadystatechange = null;
      }
    };

    // 404 Fallback
    sTimeout(function () {
      if ( ! done ) {
        done = 1;
        // Might as well pass in an error-state if we fire the 404 fallback
        cb(1);
      }
    }, timeout );

    // Inject script into to document
    // or immediately callback if we know there
    // was previously a timeout error
    err ? script.onload() : firstScript.parentNode.insertBefore( script, firstScript );
  }

  // Takes a preloaded css obj (changes in different browsers) and injects it into the head
  function injectCss ( href, cb, attrs, timeout, /* Internal use */ err, internal ) {

    // Create stylesheet link
    var link = doc.createElement( "link" ),
        done, i;

    timeout = timeout || yepnope['errorTimeout'];

    cb = internal ? executeStack : ( cb || noop );

    // Add attributes
    link.href = href;
    link.rel  = "stylesheet";
    link.type = "text/css";

    // Add our extra attributes to the link element
    for ( i in attrs ) {
      link.setAttribute( i, attrs[ i ] );
    }

    if ( ! err ) {
      firstScript.parentNode.insertBefore( link, firstScript );
      sTimeout(cb, 0);
    }
  }

  function executeStack ( ) {
    // shift an element off of the stack
    var i   = execStack.shift();
    started = 1;

    // if a is truthy and the first item in the stack has an src
    if ( i ) {
      // if it's a script, inject it into the head with no type attribute
      if ( i['t'] ) {
        // Inject after a timeout so FF has time to be a jerk about it and
        // not double load (ignore the cache)
        sTimeout( function () {
          (i['t'] == "c" ?  yepnope['injectCss'] : yepnope['injectJs'])( i['s'], 0, i['a'], i['x'], i['e'], 1 );
        }, 0 );
      }
      // Otherwise, just call the function and potentially run the stack
      else {
        i();
        executeStack();
      }
    }
    else {
      // just reset out of recursive mode
      started = 0;
    }
  }

  function preloadFile ( elem, url, type, splicePoint, dontExec, attrObj, timeout ) {

    timeout = timeout || yepnope['errorTimeout'];

    // Create appropriate element for browser and type
    var preloadElem = doc.createElement( elem ),
        done        = 0,
        firstFlag   = 0,
        stackObject = {
          "t": type,     // type
          "s": url,      // src
        //r: 0,        // ready
          "e": dontExec,// set to true if we don't want to reinject
          "a": attrObj,
          "x": timeout
        };

    // The first time (common-case)
    if ( scriptCache[ url ] === 1 ) {
      firstFlag = 1;
      scriptCache[ url ] = [];
    }

    function onload ( first ) {
      // If the script/css file is loaded
      if ( ! done && isFileReady( preloadElem.readyState ) ) {

        // Set done to prevent this function from being called twice.
        stackObject['r'] = done = 1;

        ! started && executeStack();

        // Handle memory leak in IE
        preloadElem.onload = preloadElem.onreadystatechange = null;
        if ( first ) {
          if ( elem != "img" ) {
            sTimeout(function(){ insBeforeObj.removeChild( preloadElem ) }, 50);
          }

          for ( var i in scriptCache[ url ] ) {
            if ( scriptCache[ url ].hasOwnProperty( i ) ) {
              scriptCache[ url ][ i ].onload();
            }
          }
        }
      }
    }


    // Setting url to data for objects or src for img/scripts
    if ( elem == "object" ) {
      preloadElem.data = url;
    } else {
      preloadElem.src = url;

      // Setting bogus script type to allow the script to be cached
      preloadElem.type = elem;
    }

    // Don't let it show up visually
    preloadElem.width = preloadElem.height = "0";

    // Attach handlers for all browsers
    preloadElem.onerror = preloadElem.onload = preloadElem.onreadystatechange = function(){
      onload.call(this, firstFlag);
    };
    // inject the element into the stack depending on if it's
    // in the middle of other scripts or not
    execStack.splice( splicePoint, 0, stackObject );

    // The only place these can't go is in the <head> element, since objects won't load in there
    // so we have two options - insert before the head element (which is hard to assume) - or
    // insertBefore technically takes null/undefined as a second param and it will insert the element into
    // the parent last. We try the head, and it automatically falls back to undefined.
    if ( elem != "img" ) {
      // If it's the first time, or we've already loaded it all the way through
      if ( firstFlag || scriptCache[ url ] === 2 ) {
        insBeforeObj.insertBefore( preloadElem, isGeckoLTE18 ? null : firstScript );

        // If something fails, and onerror doesn't fire,
        // continue after a timeout.
        sTimeout( onload, timeout );
      }
      else {
        // instead of injecting, just hold on to it
        scriptCache[ url ].push( preloadElem );
      }
    }
  }

  function load ( resource, type, dontExec, attrObj, timeout ) {
    // If this method gets hit multiple times, we should flag
    // that the execution of other threads should halt.
    started = 0;

    // We'll do 'j' for js and 'c' for css, yay for unreadable minification tactics
    type = type || "j";
    if ( isString( resource ) ) {
      // if the resource passed in here is a string, preload the file
      preloadFile( type == "c" ? strCssElem : strJsElem, resource, type, this['i']++, dontExec, attrObj, timeout );
    } else {
      // Otherwise it's a callback function and we can splice it into the stack to run
      execStack.splice( this['i']++, 0, resource );
      execStack.length == 1 && executeStack();
    }

    // OMG is this jQueries? For chaining...
    return this;
  }

  // return the yepnope object with a fresh loader attached
  function getYepnope () {
    var y = yepnope;
    y['loader'] = {
      "load": load,
      "i" : 0
    };
    return y;
  }

  /* End loader helper functions */
  // Yepnope Function
  yepnope = function ( needs ) {

    var i,
        need,
        // start the chain as a plain instance
        chain = this['yepnope']['loader'];

    function satisfyPrefixes ( url ) {
      // split all prefixes out
      var parts   = url.split( "!" ),
      gLen    = globalFilters.length,
      origUrl = parts.pop(),
      pLen    = parts.length,
      res     = {
        "url"      : origUrl,
        // keep this one static for callback variable consistency
        "origUrl"  : origUrl,
        "prefixes" : parts
      },
      mFunc,
      j,
      prefix_parts;

      // loop through prefixes
      // if there are none, this automatically gets skipped
      for ( j = 0; j < pLen; j++ ) {
        prefix_parts = parts[ j ].split( '=' );
        mFunc = prefixes[ prefix_parts.shift() ];
        if ( mFunc ) {
          res = mFunc( res, prefix_parts );
        }
      }

      // Go through our global filters
      for ( j = 0; j < gLen; j++ ) {
        res = globalFilters[ j ]( res );
      }

      // return the final url
      return res;
    }

    function getExtension ( url ) {
        return url.split(".").pop().split("?").shift();
    }

    function loadScriptOrStyle ( input, callback, chain, index, testResult ) {
      // run through our set of prefixes
      var resource     = satisfyPrefixes( input ),
          autoCallback = resource['autoCallback'],
          extension    = getExtension( resource['url'] );

      // if no object is returned or the url is empty/0 just exit the load
      if ( resource['bypass'] ) {
        return;
      }

      // Determine callback, if any
      if ( callback ) {
        callback = isFunction( callback ) ?
          callback :
          callback[ input ] ||
          callback[ index ] ||
          callback[ ( input.split( "/" ).pop().split( "?" )[ 0 ] ) ];
      }

      // if someone is overriding all normal functionality
      if ( resource['instead'] ) {
        return resource['instead']( input, callback, chain, index, testResult );
      }
      else {
        // Handle if we've already had this url and it's completed loaded already
        if ( scriptCache[ resource['url'] ] ) {
          // don't let this execute again
          resource['noexec'] = true;
        }
        else {
          scriptCache[ resource['url'] ] = 1;
        }

        // Throw this into the queue
        chain.load( resource['url'], ( ( resource['forceCSS'] || ( ! resource['forceJS'] && "css" == getExtension( resource['url'] ) ) ) ) ? "c" : undef, resource['noexec'], resource['attrs'], resource['timeout'] );

        // If we have a callback, we'll start the chain over
        if ( isFunction( callback ) || isFunction( autoCallback ) ) {
          // Call getJS with our current stack of things
          chain['load']( function () {
            // Hijack yepnope and restart index counter
            getYepnope();
            // Call our callbacks with this set of data
            callback && callback( resource['origUrl'], testResult, index );
            autoCallback && autoCallback( resource['origUrl'], testResult, index );

            // Override this to just a boolean positive
            scriptCache[ resource['url'] ] = 2;
          } );
        }
      }
    }

    function loadFromTestObject ( testObject, chain ) {
        var testResult = !! testObject['test'],
            group      = testResult ? testObject['yep'] : testObject['nope'],
            always     = testObject['load'] || testObject['both'],
            callback   = testObject['callback'] || noop,
            cbRef      = callback,
            complete   = testObject['complete'] || noop,
            needGroupSize,
            callbackKey;

        // Reusable function for dealing with the different input types
        // NOTE:: relies on closures to keep 'chain' up to date, a bit confusing, but
        // much smaller than the functional equivalent in this case.
        function handleGroup ( needGroup, moreToCome ) {
          if ( ! needGroup ) {
            // Call the complete callback when there's nothing to load.
            ! moreToCome && complete();
          }
          // If it's a string
          else if ( isString( needGroup ) ) {
            // if it's a string, it's the last
            if ( !moreToCome ) {
              // Add in the complete callback to go at the end
              callback = function () {
                var args = [].slice.call( arguments );
                cbRef.apply( this, args );
                complete();
              };
            }
            // Just load the script of style
            loadScriptOrStyle( needGroup, callback, chain, 0, testResult );
          }
          // See if we have an object. Doesn't matter if it's an array or a key/val hash
          // Note:: order cannot be guaranteed on an key value object with multiple elements
          // since the for-in does not preserve order. Arrays _should_ go in order though.
          else if ( isObject( needGroup ) ) {
            // I hate this, but idk another way for objects.
            needGroupSize = (function(){
              var count = 0, i
              for (i in needGroup ) {
                if ( needGroup.hasOwnProperty( i ) ) {
                  count++;
                }
              }
              return count;
            })();

            for ( callbackKey in needGroup ) {
              // Safari 2 does not have hasOwnProperty, but not worth the bytes for a shim
              // patch if needed. Kangax has a nice shim for it. Or just remove the check
              // and promise not to extend the object prototype.
              if ( needGroup.hasOwnProperty( callbackKey ) ) {
                // Find the last added resource, and append to it's callback.
                if ( ! moreToCome && ! ( --needGroupSize ) ) {
                  // If this is an object full of callbacks
                  if ( ! isFunction( callback ) ) {
                    // Add in the complete callback to go at the end
                    callback[ callbackKey ] = (function( innerCb ) {
                      return function () {
                        var args = [].slice.call( arguments );
                        innerCb && innerCb.apply( this, args );
                        complete();
                      };
                    })( cbRef[ callbackKey ] );
                  }
                  // If this is just a single callback
                  else {
                    callback = function () {
                      var args = [].slice.call( arguments );
                      cbRef.apply( this, args );
                      complete();
                    };
                  }
                }
                loadScriptOrStyle( needGroup[ callbackKey ], callback, chain, callbackKey, testResult );
              }
            }
          }
        }

        // figure out what this group should do
        handleGroup( group, !!always );

        // Run our loader on the load/both group too
        // the always stuff always loads second.
        always && handleGroup( always );
    }

    // Someone just decides to load a single script or css file as a string
    if ( isString( needs ) ) {
      loadScriptOrStyle( needs, 0, chain, 0 );
    }
    // Normal case is likely an array of different types of loading options
    else if ( isArray( needs ) ) {
      // go through the list of needs
      for( i = 0; i < needs.length; i++ ) {
        need = needs[ i ];

        // if it's a string, just load it
        if ( isString( need ) ) {
          loadScriptOrStyle( need, 0, chain, 0 );
        }
        // if it's an array, call our function recursively
        else if ( isArray( need ) ) {
          yepnope( need );
        }
        // if it's an object, use our modernizr logic to win
        else if ( isObject( need ) ) {
          loadFromTestObject( need, chain );
        }
      }
    }
    // Allow a single object to be passed in
    else if ( isObject( needs ) ) {
      loadFromTestObject( needs, chain );
    }
  };

  // This publicly exposed function is for allowing
  // you to add functionality based on prefixes on the
  // string files you add. 'css!' is a builtin prefix
  //
  // The arguments are the prefix (not including the !) as a string
  // and
  // A callback function. This function is passed a resource object
  // that can be manipulated and then returned. (like middleware. har.)
  //
  // Examples of this can be seen in the officially supported ie prefix
  yepnope['addPrefix'] = function ( prefix, callback ) {
    prefixes[ prefix ] = callback;
  };

  // A filter is a global function that every resource
  // object that passes through yepnope will see. You can
  // of course conditionally choose to modify the resource objects
  // or just pass them along. The filter function takes the resource
  // object and is expected to return one.
  //
  // The best example of a filter is the 'autoprotocol' officially
  // supported filter
  yepnope['addFilter'] = function ( filter ) {
    globalFilters.push( filter );
  };

  // Default error timeout to 10sec - modify to alter
  yepnope['errorTimeout'] = 1e4;

  // Webreflection readystate hack
  // safe for jQuery 1.4+ ( i.e. don't use yepnope with jQuery 1.3.2 )
  // if the readyState is null and we have a listener
  if ( doc.readyState == null && doc.addEventListener ) {
    // set the ready state to loading
    doc.readyState = "loading";
    // call the listener
    doc.addEventListener( "DOMContentLoaded", handler = function () {
      // Remove the listener
      doc.removeEventListener( "DOMContentLoaded", handler, 0 );
      // Set it to ready
      doc.readyState = "complete";
    }, 0 );
  }

  // Attach loader &
  // Leak it
  window['yepnope'] = getYepnope();

  // Exposing executeStack to better facilitate plugins
  window['yepnope']['executeStack'] = executeStack;
  window['yepnope']['injectJs'] = injectJs;
  window['yepnope']['injectCss'] = injectCss;

})( this, document );

/*! foundry 2014-05-16 */
var Oxydizr = {};
Oxydizr.FrontController = function FrontController() {
	this.events = {};
	this.controllers = {};
	this.handleEvent = this.handleEvent.bind(this);
	this.handleEnterpress = this.handleEnterpress.bind(this);
}

Oxydizr.FrontController.prototype = {

	catchErrors: false,

	controllers: null,

	element: null,

	errorHandler: {
		handleError: function(error, controller, event, element, params, action, controllerId) {
			console.error(error);

			console.log({
				controller: controller,
				event: event,
				element: element,
				params: params,
				action: action,
				controllerId: controllerId
			});

			return true;
		}
	},

	events: null,

	constructor: Oxydizr.FrontController,

	destructor: function() {
		if (this.controllers) {
			for (var controllerId in this.controllers) {
				if (this.controllers.hasOwnProperty(controllerId)) {
					this.unregisterController(this.controllers[controllerId]);
					this.controllers[controllerId] = null;
				}
			}

			this.controllers = null;
		}

		if (this.events) {
			for (var eventName in this.events) {
				if (this.events.hasOwnProperty(eventName)) {
					this._removeEvent(this.element, eventName, this.events[eventName]);
				}
			}

			this.events = null;
		}

		this.element = null;
	},

	init: function(element) {
		if (element) {
			this.element = element;
		}

		if (!this.element) {
			throw new Error("Missing required argument: element");
		}

		// click and submit events are so common that we just subscribe to them
		this.registerEvents("click", "submit");

		return this;
	},

	_addEvent: function(element, eventName, eventInfo) {
		if (!this.events[eventName]) {
			this.events[eventName] = eventInfo;
			this._addEventListener(element, eventInfo.name, eventInfo.handler, eventInfo.capture);
		}
	},

	_addEventListener: function(element, name, handler, capture) {
		element.addEventListener(name, handler, capture);
	},

	_createDelegateId: function() {
		var index = 1000;

		return function() {
			return String(++index);
		};
	}(),

	_getActions: function(element) {
		var actionsAttr = element.getAttribute("data-actions");

		if (!actionsAttr || /^\s*$/.test(actionsAttr)) {
			return [];
		}
		else {
			return actionsAttr
				.replace(/^\s+|\s+$/g, "")
				.split(/[.\s+]/g);
		}
	},

	_getMethodFromAction: function(controller, action, event) {
		var method = null;

		if (controller[action] && controller[action].name === (event.__type || event.type)) {
			method = action;
		}
		else if (controller.handleAction) {
			method = "handleAction";
		}

		return method;
	},

	_getParams: function(event, element) {
		var attr = element.getAttribute("data-action-params");

		return (attr) ? JSON.parse(attr) : {};
	},

	handleEnterpress: function(event) {
		if (event.keyCode === 13) {
			event.__type = "enterpress";
			this.handleEvent(event);
		}
	},

	_handleError: function(error, controller, controllerId, action, event, element, params) {
		if (controller && controller.handleActionError) {
			return controller.handleActionError(error, event, element, params, action, controller, controllerId);
		}
		else if (this.errorHandler) {
			return this.errorHandler.handleActionError(error, controller, event, element, params, action, controllerId);
		}

		return false;
	},

	handleEvent: function(event) {
		this._patchEvent(event);
		this._propagateEvent(event.target, event);
		this._unpatchEvent(event);
	},

	_invokeAction: function(controllerId, action, event, element, params) {
		var controller = this.controllers[controllerId] || null,
		    method = null;

		if (!controller) {
			event.stop();
			throw new Error("No controller registered for " + controllerId);
		}
		else if (method = this._getMethodFromAction(controller, action, event)) {
			if (this.catchErrors) {
				try {
					controller[method](event, element, params, action);
				}
				catch (error) {
					event.stop();

					if (!this._handleError(error, controller, controllerId, action, event, element, params)) {
						throw error;
					}
				}
			}
			else {
				controller[method](event, element, params, action);
			}
		}
	},

	_patchEvent: function(event) {
		event.__isStopped = false;
		event.__stopPropagation = event.stopPropagation;
		event.stopPropagation = function() {
			event.__stopPropagation();
			this.__isStopped = true;
		};
		event.__stop = event.stop || null;
		event.stop = function() {
			if (this.__stop) {
				this.__stop();
			}

			this.preventDefault();
			this.stopPropagation();
		};
	},

	_propagateEvent: function(element, event) {
		var actions = this._getActions(element),
		    params = this._getParams(event, element),
		    controllerId, action, actionParams;

		for (var i = 0, length = actions.length; i < length; i += 2) {
			controllerId = actions[i];
			action = actions[i + 1];
			actionParams = params[controllerId + "." + action] || {};
			this._invokeAction(controllerId, action, event, element, actionParams);

			if (event.__isStopped) {
				break;
			}
		}

		if (event.__isStopped || element === this.element) {
			// do nothing
		}
		else if (element.parentNode) {
			this._propagateEvent(element.parentNode, event);
		}
	},

	_registerEvent: function(eventName) {
		var eventInfo = {
			name: eventName,
			handler: this.handleEvent,
			capture: false
		};

		if (eventName === "enterpress") {
			eventInfo.name = "keypress";
			eventInfo.handler = this.handleEnterpress;
		}
		else if (eventName === "focus" || eventName === "blur") {
			eventInfo.capture = true;
		}

		this._addEvent(this.element, eventName, eventInfo);
	},

	registerEvents: function() {
		for (var i = 0, length = arguments.length; i < length; i++) {
			this._registerEvent(arguments[i]);
		}

		return this;
	},

	registerController: function(controller) {
		var controllerId = controller.controllerId || (controller.controllerId = this._createDelegateId());

		if (this.controllers[controllerId]) {
			throw new Error("Cannot register duplicate delegate Id: " + controllerId);
		}

		this.controllers[controllerId] = controller;

		controller.onControllerRegistered(this, controllerId);

		return controllerId;
	},

	_removeEvent: function(element, eventName, eventInfo) {
		if (this.events[eventName]) {
			this._removeEventListener(element, eventInfo.name, eventInfo.handler, eventInfo.capture);
			this.events[eventName] = this.events[eventName].handler = null;
		}
	},

	_removeEventListener: function(element, name, handler, capture) {
		element.removeEventListener(name, handler, capture);
	},

	_unpatchEvent: function(event) {
		event.stopPropagation = event.__stopPropagation;
		event.stop = event.__stop || null;
		event.__stop = event.__stopPropagation = event.__isStopped = null;
	},

	unregisterController: function(controller) {
		var controllerId = controller.controllerId;

		if (!controllerId || !this.controllers[controller.controllerId]) {
			return false;
		}
		else {
			this.controllers[controller.controllerId] = null;
			delete this.controllers[controller.controllerId];
			controller.onControllerUnregistered(this);
			return true;
		}
	}

};
this.Hypodermic = {};

(function(global) {

var globals = [
	"applicationCache",
	"console",
	"document",
	"localStorage",
	"location",
	"navigator",
	"screen",
	"sessionStorage"
], globalSingletons = { global: global };

for (var i = 0, key, length = globals.length; i < length; i++) {
	key = globals[i];

	if (key in global) {
		try {
			globalSingletons[key] = global[key];
		}
		catch (error) {
			var message = "Cannot seed global singletons with " + key + ". Failed with error: " + error.message;

			if (global.console && global.console.warn) {
				global.console.warn(message);
			}
			else {
				setTimeout(function() {
					throw message;
				}, 500);
			}
		}
	}
}

function Container(_configs) {

	if (!_configs) {
		throw new Error("Missing required argument: configs");
	}

	var _dependencyResolver = new Hypodermic.DependencyResolver(this),
	    _objectFactory = new Hypodermic.ObjectFactory(this, _dependencyResolver),
	    _singletons = Object.create(globalSingletons);

	_singletons.container = this;

	this.resolve = function(name, unsafe) {
		var instance = null,
		    config = _configs[name],
		    propertiesSet = {};

		if (_singletons[name]) {
			instance = _singletons[name];
		}
		else if (!config) {
			if (unsafe) {
				throw new Error("No configuration found for " + name);
			}
		}
		else if (config.template) {
			throw new Error("Cannot create resolve template config: " + name);
		}
		else {
			if (config.factory) {
				instance = _objectFactory.createInstanceFromFactory(config);
			}
			else {
				instance = _objectFactory.createInstance(config, config.constructorArgs);
			}

			if (config.singleton) {
				_singletons[name] = instance;
			}

			_dependencyResolver.injectDependencies(instance, config, propertiesSet);

			while (config = _configs[config.parent]) {
				_dependencyResolver.injectDependencies(instance, config, propertiesSet);
			}
		}

		return instance;
	};
}

global.Hypodermic.Container = Container;

})(this);

(function (global) {

function DependencyResolver(container) {
	this.container = container;
}

DependencyResolver.prototype = {

	container: null,

	constructor: DependencyResolver,

	findDependency: function(info) {
		var instance = null, factory;

		if (isString(info)) {
			instance = this.container.resolve(info, true);
		}
		else if ("value" in info) {
			instance = info.value;
		}
		else {
			throw new Error("No dependency value found. Missing one of 'id', 'value' or 'factory'");
		}

		return instance;
	},

	injectDependencies: function(instance, config, propertiesSet) {
		if (!config.properties) {
			return;
		}

		var properties = config.properties,
		    key, dependency, setter;

		for (key in properties) {
			if (properties.hasOwnProperty(key) && !propertiesSet[key]) {
				setter = "set" + capitalize(key);
				dependency = this.findDependency(properties[key]);

				if (isFunction(instance[setter])) {
					instance[setter](dependency);
				}
				else {
					instance[key] = dependency;
				}

				propertiesSet[key] = true;
			}
		}
	}

};

global.Hypodermic.DependencyResolver = DependencyResolver;

// utils

var toString = Object.prototype.toString;

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.substring(1, str.length);
}

function isFunction(x) {
	return toString.call(x) === "[object Function]";
}

function isString(x) {
	return toString.call(x) === "[object String]";
}

})(this);

(function(global) {

function ObjectFactory(container, dependencyResolver) {
	this.container = container;
	this.dependencyResolver = dependencyResolver;
}

ObjectFactory.prototype = {

	container: null,

	dependencyResolver: null,

	constructor: ObjectFactory,

	createInstance: function(config, constructorDependencies) {
		if (!config.type) {
			throw new Error("Missing required argument: config.type");
		}

		var Klass = this._getClassReference(config.type),
		    instance = null,
		    args = null;

		if (!Klass) {
			throw new Error("Class " + config.type + " not found.");
		}
		else if (Klass.constructor === Function) {
			instance = Object.create(Klass.prototype);

			if (constructorDependencies) {
				args = this._getConstructorArgs(constructorDependencies);
				Klass.apply(instance, args);
			}
			else {
				Klass.call(instance);
			}
		}
		else {
			// object singleton/static class
			instance = Klass;
		}

		return instance;
	},

	createInstanceFromFactory: function(config) {
		if (!config.factory.id) {
			throw new Error("Missing required argument: config.factory.id");
		}

		var factoryInfo = config.factory,
		    factory = this.container.resolve(factoryInfo.id, true),
		    method = factoryInfo.method || "createInstance",
		    args = [], dependency, i, length;

		if (factoryInfo.args && factoryInfo.args.length) {
			for (i = 0, length = factoryInfo.args.length; i < length; i++) {
				args.push(this.dependencyResolver.findDependency(factoryInfo.args[i]));
			}
		}
		else {
			args.push(factoryInfo.type);
		}

		if (!factory[method]) {
			throw new Error("No method called " + method + " exists on the factory object registered as " + factoryInfo.id);
		}

		dependency = factory[method].apply(factory, args);

		return dependency;
	},

	_getClassReference: function(className) {
		var Klass = _classCache[className] || null;

		if (!Klass && /^[a-zA-Z][\w.$]+$/.test(className)) {
			try {
				Klass = global.eval(className);
			}
			catch (error) {
				Klass = null;
			}
		}

		if (Klass) {
			_classCache[className] = Klass;
		}

		return Klass;
	},

	_getConstructorArgs: function(dependencies) {
		var args = [];

		for (var i = 0, length = dependencies.length; i < length; i++) {
			args.push(this.dependencyResolver.findDependency(dependencies[i]));
		}

		return args;
	}

};

global.Hypodermic.ObjectFactory = ObjectFactory;

// Seed the class cache with some defaults
var _classCache = {};

var conditionalClasses = [
	"Array",
	"Boolean",
	"Date",
	"document",
	"DocumentFragment",
	"DOMParser",
	"Error",
	"FileReader",
	"Function",
	"location",
	"navigator",
	"Number",
	"Object",
	"RegExp",
	"String",
	"XMLHttpRequest"
];

var i, length, x;

for (i = 0, length = conditionalClasses.length; i < length; i++) {
	x = conditionalClasses[i];

	if (global[x] !== undefined) {
		_classCache[x] = global[x];
	}
}

})(this);

/*! module-manager 2014-05-16 */
/*! module-manager 2014-05-16 */
this.Module = this.Module || {};
(function() {

function Factory() {};

Factory.prototype = {

	objectFactory: null,

	constructor: Factory,

	destructor: function() {
		this.objectFactory = null;
	},

	getInstance: function(type) {
		var instance = null, Klass = null;

		if (this.objectFactory) {
			instance = this.objectFactory.getInstance(type);
		}

		if (!instance) {
			if (/^[a-zA-Z][a-zA-Z0-9.]+[a-zA-Z0-9]$/.test(type)) {
				try {
					Klass = eval(type);
				}
				catch (error) {
					throw new Error("Class name " + type + " does not exist");
				}

				if (!Klass) {
					throw new Error("Class name " + type + " does not exist");
				}
				else if (typeof Klass !== "function") {
					throw new Error("Class name " + type + " is not a constructor function");
				}

				instance = new Klass();
			}
			else {
				throw new Error("Cannot instantiate invalid type: " + type);
			}
		}

		return instance;
	}

};

Module.Factory = Factory;

})();

(function() {

function Manager() {};

Manager.prototype = {

	baseClassName: "module",

	defaultModule: null,

	defaultModuleFocused: false,

	moduleObserver: {
		onModuleCreated: function(module, element, type) {},
		onSubModuleCreated: function(module, element, type) {},
		onModuleRegistered: function(module, type) {},
		onModuleUnregistered: function(module) {}
	},

	provider: null,

	registry: null,

	groups: null,

	constructor: Module.Manager,

	destructor: function(cascadeDestroy) {
		if (Module.manager === this) {
			Module.manager = null;
		}

		if (this.registry) {
			this._destroyRegistry(cascadeDestroy);
		}

		if (this.groups) {
			this._destroyGroups();
		}

		if (this.provider) {
			if (cascadeDestroy) {
				this.provider.destructor();
			}

			this.provider = null;
		}

		if (this.lazyLoader) {
			this.lazyLoader.destructor();
			this.lazyLoader = null;
		}
	},

	_destroyGroups: function() {
		var key, group, i, length;

		for (key in this.groups) {
			if (this.groups.hasOwnProperty(key)) {
				group = this.groups[key];

				for (i = 0, length = group.length; i < length; i++) {
					group[i] = null;
				}

				this.groups[key] = null;
			}
		}

		this.groups = null;
	},

	_destroyRegistry: function(cascadeDestroy) {
		var key, entry;

		for (key in this.registry) {
			if (this.registry.hasOwnProperty(key)) {
				entry = this.registry[key];
				this.moduleObserver.onModuleUnregistered(entry.module);

				if (cascadeDestroy) {
					entry.module.destructor(true);
				}

				entry.module = null;
				this.registry[key] = null;
			}
		}

		this.registry = null;
	},

	init: function() {
		this.provider = this.provider || new Module.Provider();
		this.provider.factory = this.provider.factory || new Module.Factory();
		this.provider.manager = this;
		this.provider.moduleObserver = this.moduleObserver;
		this.registry = this.registry || {};
		this.groups = this.groups || {};

		Module.manager = this;

		return this;
	},

	eagerLoadModules: function(element) {
		var els = element.querySelectorAll("[data-modules]"),
			i = 0;

		for (i; i < els.length; i++) {
			this.createModules(els[i]);
		}

		els = null;

		return this;
	},

	lazyLoadModules: function(element, options) {
		this.lazyLoader = (this.lazyLoader || new Module.LazyLoader())
			.setManager(this)
			.setElement(element)
			.setOptions(options)
			.init();

		element = options = null;

		return this;
	},

	createModule: function(element, type, options, register) {
		var module = this.provider.createModule(element, type, options);

		if (register) {
			this.registerModule(type, module);
		}

		element = options = null;

		return module;
	},

	createModules: function(element, lazyLoad) {
		if (!element) {
			throw new Error("Missing required argument: element");
		}
		else if (!lazyLoad && element.getAttribute("data-module-lazyload")) {
			return [];
		}
		else if (element.getAttribute("data-module-property")) {
			return [];
		}

		var metaData = new Module.MetaData(element),
		    modules = [];

		if (metaData.mediaMatches()) {
			this.provider.createModules(metaData, function(module, element, type, options) {
				modules.push(module);
				this.registerModule(type, module);
				module.init();
			}, this);

			this.markModulesCreated(element, metaData);
		}

		metaData = element = null;

		return modules;
	},

	focusDefaultModule: function(anything) {
		if (this.defaultModule && !this.defaultModuleFocused) {
			this.defaultModuleFocused = true;
			this.defaultModule.focus(anything);
		}
	},

	initModuleInContainer: function(element, container, config, template, type, module) {
		var createdAt = new Date();
		var renderData = {
			guid: module.guid,
			createdAt: createdAt,
			timestamp: createdAt.getTime(),
			controllerId: module.controllerId
		}, key;

		if (config.renderData) {
			for (key in config.renderData) {
				if (config.renderData.hasOwnProperty(key)) {
					renderData[key] = config.renderData[key];
				}
			}
		}

		var html = template.innerHTML.replace(/#\{([-.\w]+)\}/g, function(match, key) {
			return renderData[key] || "";
		});

		element.className += (" " + this.baseClassName + " " + config.className).replace(/\s{2,}/g, " ");
		element.innerHTML = html;

		if (config.insert === "top" && container.firstChild) {
			container.insertBefore(element, container.firstChild);
		}
		else {
			container.appendChild(element);
		}

		this.registerModule(type, module);
		module.init();

		if (config.autoFocus) {
			module.focus(!!config.autoFocusAnything);
		}
	},

	markModulesCreated: function(element, metaData) {
		element.setAttribute("data-modules-created", metaData.types.join(" "));
		element.removeAttribute("data-modules");
		element = metaData = null;
	},

	registerModule: function(type, module) {
		if (module.guid === undefined || module.guid === null) {
			throw new Error("Cannot register module " + type + " without a guid property");
		}
		else if (this.registry[module.guid]) {
			throw new Error("Module " + module.guid + " has already been registered");
		}

		this.registry[module.guid] = {module: module, type: type};

		if (!this.groups[type]) {
			this.groups[type] = [];
		}

		this.groups[type].push(module);
		this.moduleObserver.onModuleRegistered(module, type);

		module = null;
	},

	unregisterModule: function(module) {
		if (!module.guid || !this.registry[module.guid]) {
			module = null;
			return false;
		}

		var guid = module.guid,
		    type = this.registry[guid].type,
		    group = this.groups[type],
		    unregistered = false;

		this.registry[guid].module = null;
		this.registry[guid] = null;
		delete this.registry[guid];

		if (group) {
			for (var i = 0, length = group.length; i < length; i++) {
				if (group[i] === module) {
					group.splice(i, 1);
					unregistered = true;
					this.moduleObserver.onModuleUnregistered(module);
					break;
				}
			}
		}

		module = group = null;

		return unregistered;
	},

	setDefaultModule: function(module) {
		if (!this.defaultModule) {
			this.defaultModule = module;
		}

		module = null;
	}

};

Module.Manager = Manager;

})();

(function(g) {

	function MetaData(element) {
		this.options = null;
		this.types = [];

		if (element) {
			this.setElement(element);
		}
	}

	MetaData.prototype = {

		element: null,

		media: null,

		options: null,

		types: null,

		constructor: MetaData,

		forEach: function(callback, context) {
			var i = 0, length = this.types.length,
			    result, type, options;

			if (length === 1) {
				callback.call(context, this.element, this.types[0], this.options, 0, this);
			}
			else {
				for (i; i < length; ++i) {
					type = this.types[i];
					options = this.options[type] || {};
					result = callback.call(context, this.element, type, options, i, this);

					if (result === false) {
						break;
					}
				}
			}
		},

		mediaMatches: function() {
			if (!g.matchMedia) {
				throw new Error("This browser does not support JavaScript media queries. Please include a polyfill (https://github.com/paulirish/matchMedia.js)");
			}

			return this.media === null || g.matchMedia(this.media).matches;
		},

		setElement: function(element) {
			this.element = element;

			var types = element.getAttribute("data-modules"),
			    options = element.getAttribute("data-module-options");

			if (!types) {
				throw new Error("Missing required attribute data-modules on " + element.nodeName + "." + element.className.split(/\s+/g).join(".") + "#" + element.id);
			}

			this.types = types
				.replace(/^\s+|\s+$/g, "")
				.split(/\s+/g);

			this.options = options ? JSON.parse(options) : {};
			this.media = element.getAttribute("data-module-media");
		}

	};

	g.Module.MetaData = MetaData;

})(this);

(function() {

function Provider() {}

Provider.prototype = {

	factory: null,

	manager: null,

	moduleObserver: null,

	subModulesEnabled: true,

	constructor: Provider,

	destructor: function(cascadeDestroy) {
		if (cascadeDestroy && this.factory) {
			this.factory.destructor();
		}

		this.factory = this.manager = null;
	},

	_createModuleClass: function(type) {
		return "module " + type.charAt(0).toLowerCase() + type.slice(1, type.length)
			.replace(/(\.[A-Z])/g, function(match, $1) {
				return "-" + $1.replace(/\./g, "").toLowerCase();
			})
			.replace(/Module$/, "")
			.replace(/^\s+|\s+$/g, "");
	},

	createModule: function(element, type, options) {
		var module = this.factory.getInstance(type);
		var className = this._createModuleClass(type);

		element.className += element.className ? " " + className : className;

		module.setElement(element);
		module.setOptions(options);

		if (options.defaultModule) {
			this.manager.setDefaultModule(module);
		}

		this.moduleObserver.onModuleCreated(module, element, type);

		if (this.subModulesEnabled && !options.subModulesDisabled) {
			this._createSubModules(module);
		}

		return module;
	},

	createModules: function(metaData, callback, context) {
		var modules = [],
		    module,
		    callback = callback || function() {};

		metaData.forEach(function(element, type, options) {
			module = this.createModule(element, type, options);
			modules.push(module);
			callback.call(context, module, element, type, options);
		}, this);

		callback = context = module = null;

		return modules;
	},

	_createSubModules: function(module) {
		var els = module.element.getElementsByTagName("*"),
		    length = els.length,
		    i = 0, element, name;

		for (i; i < length; i++) {
			element = els[i];
			name = element.getAttribute("data-module-property");

			if (name) {
				this._createSubModuleProperty(module, name, element);
			}
		}
	},

	_createSubModuleProperty: function(parentModule, name, element) {
		var metaData = new Module.MetaData(element),
		   subModule;

		if (metaData.types.length > 1) {
			throw new Error("Sub module elements cannot have more than one type specified in data-modules");
		}

		subModule = this.createModule(element, metaData.types[0], metaData.options);
		this.moduleObserver.onSubModuleCreated(subModule, element, metaData.types[0]);
		subModule.init();

		if (parentModule[name] === null) {
			parentModule[name] = subModule;
		}
		else if (parentModule[name] instanceof Array) {
			if (!parentModule.hasOwnProperty(name)) {
				parentModule[name] = [];
			}

			parentModule[name].push(subModule);
		}
		else {
			throw new Error("Cannot create sub module property '" + name + "'. Property is neither null nor an Array on the parent module.");
		}

		this.manager.markModulesCreated(element, metaData);

		subModule = metaData = element = null;
	}

};

Module.Provider = Provider;

})();

/*! module-manager 2014-05-16 */
Module.FrontControllerModuleObserver = function FrontControllerModuleObserver(frontController) {
	this.frontController = frontController || null;
};

Module.FrontControllerModuleObserver.prototype = {

	frontController: null,

	constructor: Module.FrontControllerModuleObserver,

	_ensureControllerId: function(module) {
		module.controllerId = module.controllerId
		                   || module.options.controllerId
		                   || module.guid;
	},

	onModuleCreated: function(module, element, type) {
		this._ensureControllerId(module);
	},

	onSubModuleCreated: function(module, element, type) {
		this.frontController.registerController(module);
	},

	onModuleRegistered: function(module, type) {
		this.frontController.registerController(module);
	},

	onModuleUnregistered: function(module) {
		this.frontController.unregisterController(module);
	}

};
/*! module-manager 2014-05-16 */
/*! browser-viewport 2014-05-16 */
function Viewport(_window) {
	if (!_window) {
		throw new Error("Missing required argument: window");
	}

	// Private Properties

	var self = this,
	    _events = {
	    	"resize:complete": {
	    		type: "resize",
	    		handle: null,
	    		useCapture: false,
	    		bound: false,
	    		listeners: [],
	    		element: _window
	    	},
	    	"scroll:complete": {
	    		type: "scroll",
	    		handle: null,
	    		useCapture: false,
	    		bound: false,
	    		listeners: [],
	    		element: _window.document
	    	}
	    },
	    _eventListenerDelay = 20,
	    _orientation = _window.orientation || this.height > this.width ? 0 : 90;
	    _orientationEvent = {
	    	mql: _window.matchMedia ? _window.matchMedia("(orientation: portrait)") : null,
	    	regex: /^orientation:\w+$/i,
	    	listeners: {
	    		count: 0,
		    	"orientation:change": [],
		    	"orientation:portrait": [],
		    	"orientation:landscape": []
		    },
	    	test: function(type) {
	    		return this.regex.test(type)
	    		    && !!this.listeners[type];
	    	}
	    },
	    _resizeTimer = null,
	    _resizeTimeout = 300,
	    _scrollTimer = null,
	    _scrollTimeout = 300,
	    createAccessor = function(name, get, set) {
	    	Object.defineProperty(self, name, {
	    		enumerable: true,
	    		get: get,
	    		set: set
	    	});
	    },
	    createGetter = function(name, get) {
	    	Object.defineProperty(self, name, {
	    		enumerable: true,
	    		get: get
	    	});
	    };

	// Public Properties

	createGetter("bottom", function() {
		return _window.pageYOffset + _window.innerHeight;
	});

	createGetter("document", function() {
		return _window.document;
	});

	createAccessor("eventListenerDelay",
		function() {
			return _eventListenerDelay;
		},
		function(value) {
			_eventListenerDelay = value;
		}
	);

	createGetter("height", function() {
		return _window.innerHeight;
	});

	createGetter("left", function() {
		return _window.pageXOffset;
	});

	createGetter("location", function() {
		return _window.location;
	});

	createGetter("orientation", function() {
		return _orientation;
	});

	createAccessor("resizeTimeout",
		function() {
			return _resizeTimeout;
		},
		function(value) {
			_resizeTimeout = value;
		}
	);

	createGetter("right", function() {
		return _window.pageXOffset + _window.innerWidth;
	});

	createGetter("screen", function() {
		return _window.screen;
	});

	createAccessor("scrollTimeout",
		function() {
			return _scrollTimeout;
		},
		function(value) {
			_scrollTimeout = value;
		}
	);

	createGetter("top", function() {
		return _window.pageYOffset;
	});

	createGetter("width", function() {
		return _window.innerWidth;
	});

	createGetter("window", function() {
		return _window;
	});

	// Public Methods

	this.destructor = function() {
		if (_resizeTimer) {
			_window.clearTimeout(_resizeTimer);
			_resizeTimer = null;
		}

		if (_scrollTimer) {
			_window.clearTimeout(_scrollTimer);
			_scrollTimer = null;
		}

		removeSpecialEvent(_events["resize:complete"]);
		removeSpecialEvent(_events["scroll:complete"]);

		self = _events = _window = null;
	};

	this.addEventListener = function(type, listener) {
		type = type.toLowerCase();

		var event, listeners;

		if (_orientationEvent.test(type)) {
			listeners = _orientationEvent.listeners;

			if (!listeners.count && _orientationEvent.mql) {
				_orientationEvent.mql.addListener(handleOrientationChangeEvent);
			}

			listeners[type].push(listener);
			listeners.count++;
		}
		else if (event = _events[type]) {
			addSpecialEvent(event);
			event.listeners.push(listener);
		}
	};

	this.removeEventListener = function(type, listener) {
		type = type.toLowerCase();

		var event, index, listeners;

		if (_orientationEvent.test(type)) {
			listeners = _orientationEvent.listeners[type];
			index = listeners.indexOf(listener);

			if (index > -1) {
				listeners.splice(index, 1);

				if (--listeners.count === 0 && _orientationEvent.mql) {
					_orientationEvent.mql.removeListener(handleOrientationChangeEvent);
				}
			}
		}
		else if (_events[type]) {
			event = _events[type];
			index = event.listeners.indexOf(listener);

			if (index > -1) {
				event.listeners.splice(index, 1);

				if (!event.listeners.length) {
					removeSpecialEvent(event);
				}
			}
		}
	};

	// Private Methods

	var addSpecialEvent = function(event) {
		if (event.bound) {
			return;
		}

		event.element.addEventListener(event.type, event.handle, event.useCapture);
		event.bound = true;
	},
	fireResizedEvent = function() {
		fireEvent(_events["resize:complete"].listeners);
	},
	fireScrollCompleteEvent = function() {
		fireEvent(_events["scroll:complete"].listeners);
	},
	fireEvent = function(listeners) {
		if (!listeners.length) {
			return;
		}

		var callback = function() {
			if (++i === listeners.length || listeners[i](self) === false) {
				return;
			}

			_window.setTimeout(callback, _eventListenerDelay);
		}, i = -1;

		callback();
	},
	handleOrientationChangeEvent = function(m) {
		_orientation = m.matches ? 0 : _window.orientation || 90;

		fireEvent(_orientationEvent.listeners["orientation:change"]);

		if (m.matches) {
			fireEvent(_orientationEvent.listeners["orientation:portrait"]);
		}
		else {
			fireEvent(_orientationEvent.listeners["orientation:landscape"]);
		}
	},
	handleResizeEvent = function(event) {
		if (_resizeTimer) {
			_window.clearTimeout(_resizeTimer);
			_resizeTimer = null;
		}

		_resizeTimer = _window.setTimeout(fireResizedEvent, _resizeTimeout);
	},
	handleScrollEvent = function(event) {
		if (_scrollTimer) {
			_window.clearTimeout(_scrollTimer);
			_scrollTimer = null;
		}

		_scrollTimer = _window.setTimeout(fireScrollCompleteEvent, _scrollTimeout);
	},
	removeSpecialEvent = function(event) {
		if (!event.bound) {
			return;
		}

		event.element.removeEventListener(event.type, event.handle, event.useCapture);
		event.bound = false;
	};

	_events["resize:complete"].handle = handleResizeEvent;
	_events["scroll:complete"].handle = handleScrollEvent;
}

Viewport.prototype = {

	constructor: Viewport,

	contains: function(element) {
		var their = this.getElementPosition(element),
		    my = this.getPosition();

		if (their.left < my.right
			&& their.right > my.left
			&& their.top < my.bottom
			&& their.bottom > my.top) {
			return true;
		}
		else {
			return false;
		}
	},

	getElementPosition: function(element) {
		var pos = {
			left:   element.offsetLeft,
			top:    element.offsetTop,
			width:  element.offsetWidth,
			height: element.offsetHeight
		};

		while (element = element.offsetParent) {
			pos.left += element.offsetLeft;
			pos.top += element.offsetTop;
		}

		pos.right = pos.left + pos.width;
		pos.bottom = pos.top + pos.height;

		return pos;
	},

	getPosition: function() {
		return {
			left:   this.left,
			top:    this.top,
			width:  this.width,
			height: this.height,
			right:  this.right,
			bottom: this.bottom
		};
	},

	is: function(x) {
		return this === x
		    || this.window === x
		    || this.screen === x
		    || this.document === x;
	},

	matchMedia: function(query) {
		return this.window.matchMedia
		     ? this.window.matchMedia(query)
		     : { matches: false };
	},

	querySelector: function(selector, callback, context) {
		var element = null;

		this.querySelectorAll(selector, function(el) {
			element = el;
			return false;
		});

		return element;
	},

	querySelectorAll: function(selector, callback, context) {
		callback = callback || function() {};
		context = context || this;

		var elements = this.document.body.querySelectorAll(selector),
		    i = 0, result, matches = [], element;

		for (i; i < elements.length; i++) {
			element = elements[i];

			if (this.contains(element)) {
				matches.push(element);

				if (result !== false) {
					result = callback.call(context, element, i, this);
				}
			}
		}

		return matches;
	},

	toString: function() {
		return "[object Viewport: " + this.location + "]";
	}

};

(function() {

function LazyLoader() {
	this.handleScrollComplete = this.handleScrollComplete.bind(this);
	this.handleResizeComplete = this.handleResizeComplete.bind(this);
	this.handleMouseover = this.handleMouseover.bind(this);
	this.options = {
		resizeTimeout: 0,
	    scrollTimeout: 0
	};
}
LazyLoader.prototype = {

	document: null,

	element: null,

	manager: null,

	options: null,

	viewport: null,

	window: null,

	constructor: LazyLoader,

	destructor: function() {
		if (this.viewport) {
			this.viewport.removeEventListener("scroll:complete", this.handleScrollComplete);
			this.viewport.removeEventListener("resize:complete", this.handleResizeComplete);
			this.viewport = null;
		}

		if (this.element) {
			this.element.removeEventListener("mouseover", this.handleMouseover, false);
			this.element = null;
		}

		this.document = this.window = this.options = this.manager = null;
	},

	init: function() {
		if (!this.viewport) {
			this.setViewport(new Viewport(window));
		}

		if (this.options.resizeTimeout > 0) {
			this.viewport.resizeTimeout = this.options.resizeTimeout;
		}

		if (this.options.scrollTimeout > 0) {
			this.viewport.scrollTimeout = this.options.scrollTimeout;
		}

		this.viewport.addEventListener("scroll:complete", this.handleScrollComplete);
		this.viewport.addEventListener("resize:complete", this.handleResizeComplete);
		this.element.addEventListener("mouseover", this.handleMouseover, false);

		this._initModulesInViewport();

		return this;
	},

	handleMouseover: function(event) {
		event = event || window.event;
		event.target = event.target || event.srcElement;

		if (event.target.getAttribute("data-module-lazyload")) {
			this._lazyLoadModules(event.target, event.type);
		}
	},

	handleScrollComplete: function(viewport) {
		this._initModulesInViewport();
	},

	handleResizeComplete: function(viewport) {
		this._initModulesInViewport();
	},

	_initModulesInViewport: function() {
		this.viewport.querySelectorAll("[data-module-lazyload]", function(element) {
			this._lazyLoadModules(element, "scrollto");
		}, this);
	},

	_lazyLoadModules: function(element, value) {
		var attr = element.getAttribute("data-module-lazyload");

		if (attr === "any" || new RegExp(value).test(attr)) {
			if (this.manager.createModules(element, true).length) {
				element.removeAttribute("data-module-lazyload");
				element.setAttribute("data-module-lazyloaded", attr);
			}
		}
	},

	setElement: function(element) {
		this.element = element;
		this.document = element.ownerDocument;
	    this.window = this.document.defaultView;
		return this;
	},

	setManager: function(manager) {
		this.manager = manager;
		return this;
	},

	setOptions: function(overrides) {
		if (overrides) {
			for (var key in overrides) {
				if (overrides.hasOwnProperty(key)) {
					this.options[key] = overrides[key];
				}
			}
		}

		return this;
	},

	setViewport: function(viewport) {
		this.viewport = viewport;
		this.setElement(viewport.document.documentElement);
		return this;
	}

};

Module.LazyLoader = LazyLoader;

})();

var Foundry = {
	version: "0.1.1"
};

Foundry.run = function(callback) {
	callback = callback || function() {};

	var config = {
		application: {
			type: "Foundry.Application",
			singleton: true,
			properties: {
				container: "container",
				dispatcher: "eventDispatcher",
				frontController: "frontController",
				moduleManager: "moduleManager"
			}
		},
		viewport: {
			type: "Viewport",
			singleton: true,
			constructorArgs: [
				"global"
			]
		},
		frontController: {
			type: "Oxydizr.FrontController",
			singleton: true
		},
		eventDispatcher: {
			type: "Beacon.Dispatcher",
			singleton: true
		},
		objectFactory: {
			type: "Foundry.ModuleFactory",
			singleton: true,
			properties: {
				container: "container"
			}
		},
		moduleFactory: {
			type: "Module.Factory",
			singleton: true,
			properties: {
				objectFactory: "objectFactory"
			}
		},
		moduleProvider: {
			type: "Module.Provider",
			singleton: true,
			properties: {
				factory: "moduleFactory"
			}
		},
		moduleManager: {
			type: "Module.Manager",
			singleton: true,
			properties: {
				provider: "moduleProvider",
				moduleObserver: "moduleObserver",
				lazyLoader: "moduleLazyLoader"
			}
		},
		moduleObserver: {
			type: "Module.FrontControllerModuleObserver",
			properties: {
				frontController: "frontController"
			}
		},
		moduleLazyLoader: {
			type: "Module.LazyLoader",
			singleton: true,
			properties: {
				manager: "moduleManager",
				viewport: "viewport"
			}
		},
		module: {
			template: true,
			properties: {
				elementStore: "elementStore",
				eventDispatcher: "eventDispatcher"
			}
		},
		elementStore: {
			type: "ElementStore"
		},
		merge: function(overrides) {
			for (var key in overrides) {
				if (overrides.hasOwnProperty(key)) {
					this[key] = overrides[key];
				}
			}

			return this;
		}
	};

	var options = { autoInit: true },
	    element = callback(config, options) || document.documentElement,
	    container = new Hypodermic.Container(config),
	    app = container.resolve("application");

	if (options.autoInit) {
		app.init(element, options);
	}
	else {
		app.setElement(element);
		app.setOptions(options);
	}

	return app;
};

Foundry.Application = function() {
	this.options = {
		eagerLoadModules: true,
		focusAnythingInDefaultModule: false,
		handleActionErrors: true,
		handleApplicationErrors: true,
		lazyLoadModules: false,
		subModulesDisabled: false
	};
};

Foundry.Application.prototype = {

	dispatcher: null,

	document: null,

	element: null,

	errorHandler: null,

	eventsController: null,

	frontController: null,

	moduleManager: null,

	newModuleController: null,

	options: null,

	window: null,

	constructor: Foundry.Application,

	init: function(element, options) {
		if (element) {
			this.setElement(element);
		}

		if (options) {
			this.setOptions(options);
		}

		this._initErrorHandling();

		try {
			this.frontController.init(this.element);
			this._initEventsController();
			this._initNewModuleController();
			this._initModuleManager();
			this.dispatcher.publish("application.ready", this);
		}
		catch (error) {
			if (!this.errorHandler || !this.errorHandler.handleError(error)) {
				throw error;
			}
		}

		return this;
	},

	_initErrorHandling: function() {
		if (this.options.handleApplicationErrors) {
			this.errorHandler = this.errorHandler || new Foundry.ErrorHandler();
			this.errorHandler.init(this, this.window);

			if (!this.frontController.errorHandler && this.options.handleActionErrors) {
				this.frontController.errorHandler = this.errorHandler;
			}
		}
	},

	_initEventsController: function() {
		this.eventsController = this.eventsController || new Foundry.ApplicationEventsController(this.dispatcher);
		this.frontController.registerController(this.eventsController);
	},

	_initModuleManager: function() {
		this.moduleManager.init();

		if (this.options.eagerLoadModules) {
			this.moduleManager.eagerLoadModules(this.element);
		}

		if (this.options.lazyLoadModules) {
			this.moduleManager.lazyLoadModules(this.element);
		}

		this.moduleManager.focusDefaultModule(this.options.focusAnythingInDefaultModule);
	},

	_initNewModuleController: function() {
		var newModuleController = this.newModuleController || new Foundry.NewModuleController();
		newModuleController.dispatcher = this.dispatcher;
		newModuleController.document = this.document;
		newModuleController.frontController = this.frontController;
		newModuleController.moduleManager = this.moduleManager;
		newModuleController.init();
		this.newModuleController = newModuleController
	},

	destructor: function() {
		this.dispatcher.publish("application.destroy", this);
		this.moduleManager.destructor(true);
		this.errorHandler.destructor();
		this.eventsController.destructor();
		this.newModuleController.destructor();
		this.frontController.destructor();
		this.dispatcher.destructor();

		this.newModuleController =
		this.eventsController =
		this.dispatcher =
		this.frontController =
		this.moduleManager =
		this.errorHandler =
		this.element =
		this.document =
		this.window =
		this.logger =
		this.options = null;
	},

	setElement: function(element) {
		this.element = element;
		this.document = element.ownerDocument;
		this.window = this.document.defaultView;
	},

	setOptions: function(options) {
		for (var key in options) {
			if (options.hasOwnProperty(key)) {
				this.options[key] = options[key];
			}
		}
	}

};

Foundry.ApplicationEventsController = function(dispatcher) {
	this.dispatcher = dispatcher;
};

Foundry.ApplicationEventsController.prototype = {

	controllerId: "events",

	dispatcher: null,

	frontController: null,

	constructor: Foundry.ApplicationEventsController,

	destructor: function() {
		if (this.frontController) {
			this.frontController.unregisterController(this);
		}

		this.dispatcher = this.frontController = null;
	},

	onControllerRegistered: function(frontController, controllerId) {
		this.frontController = frontController;
	},

	onControllerUnregistered: function(frontController) {
	},

	/**
	 * Application#publishEvent(event, element, params)
	 * - event (Event): The browser event object.
	 * - element (HTMLElement): The HTML element with the data-action attribute.
	 * - params (Object): Action params.
	 * - params.event (String): Required name of the application event to publish.
	 * - params.data (Object): Optional data to pass along in the event.
	 *
	 * Publish an event on the global event dispatcher, triggered by a user action,
	 * such as a click. The element is passed along as the publisher of the event,
	 * and arbitrary data is passed along via the params.data property.
	 **/
	publishEvent: function click(event, element, params) {
		if (!params.event) {
			throw new Error("Missing required argument params.event");
		}

		event.stop();
		this.dispatcher.publish(params.event, element, params.data || {});
	}

};
Foundry.ErrorHandler = function() {
};

Foundry.ErrorHandler.prototype = {

	application: null,

	logger: window.console || null,

	window: null,

	constructor: Foundry.ErrorHandler,

	destructor: function() {
		if (this.window) {
			this.window.onerror = null;
		}

		this.application = this.logger = this.window = null;
	},

	init: function(application, window) {
		this.application = application;
		this.window = window;
		this.window.onerror = this.handleError.bind(this);
	},

	_getErrorObject: function(errorMessage) {
		var info = errorMessage.match(/^(([A-Za-z_][A-Za-z0-9._]*):)?(.+$)/),
		    error = null, className, message, Klass;

		if (!info) {
			error = new Error(message);
		}
		else {
			className = info[2] || "Error";
			message = (info[3] || errorMessage).replace(/^\s+|\s+$/g, "");

			if (/^[A-Za-z_][A-Za-z0-9._]*$/.test(className)) {
				try {
					Klass = eval(className);
					error = new Klass(message);
				}
				catch (error) {
					throw new Error("Class '" + className + "' is either not found or not an object constructor function");
				}
			}
			else {
				error = new Error(message);
			}
		}

		return error;
	},

	handleActionError: function(error, event, element, params, action, controller, controllerId) {
		if (this.logger) {
			this.logger.error(error);

			this.logger.debug({
				error: error,
				event: event,
				element: element,
				params: params,
				action: action,
				controller: controller,
				controllerId: controllerId
			});
		}
		else {
			throw error;
		}
	},

	handleError: function(errorMessage) {
		var error = typeof errorMessage === "string" ? this._getErrorObject(errorMessage) : errorMessage;

		return this._handleError(error);
	},

	_handleError: function(error) {
		if (this.logger) {
			this.logger.error(error);

			return true;
		}

		return false;
	}

};

Foundry.ModuleFactory = function ModuleFactory() {
}

Foundry.ModuleFactory.prototype = {

	container: null,

	constructor: Foundry.ModuleFactory,

	destructor: function() {
		this.container = null;
	},

	getInstance: function(type) {
		return this.container.resolve(type);
	}

};

Foundry.ModuleObserver = function(frontController) {
	this.frontController = frontController || null;
};

Foundry.ModuleObserver.prototype = {

	frontController: null,

	constructor: Foundry.ModuleObserver,

	destructor: function() {
		this.frontController = null;
	},

	onModuleCreated: function(module, element, type) {
		module.controllerId = module.options.controllerId || module.guid;
	},

	onModuleRegistered: function(module, type) {
		this.frontController.registerController(module);
	},

	onModuleUnregistered: function(module) {
		this.frontController.unregisterController(module);
	}

};

Foundry.NewModuleController = function() {};

Foundry.NewModuleController.prototype = {

	controllerId: "newModules",

	dispatcher: null,

	document: null,

	frontController: null,

	moduleManager: null,

	constructor: Foundry.NewModuleController,

	destructor: function() {
		if (this.dispatcher) {
			this.dispatcher.unsubscribe(this);
		}

		if (this.frontController) {
			this.frontController.unregisterController(this);
		}

		this.dispatcher = this.document = this.moduleManager = this.frontController = null;
	},

	init: function() {
		this.dispatcher.subscribe(this.controllerId + ".createModule", this, "handleCreateModule");
		this.frontController.registerController(this);
	},

	/**
	 * Application#createModule(event, element, params)
	 * - event (Event): The browser event object
	 * - element (HTMLElement): The HTML element with the data-action attribute on it.
	 * - params (Object): Action params used to create the new module.
	 *
	 * Creates a new module on the page triggered by a user event. The
	 * new module is created, including its root element, and appended
	 * to a container on the page.
	 **/
	createModule: function click(event, element, params) {
		event.stop();
		this._createModuleFromConfig(params);
		event = element = params = null;
	},

	/**
	 * Application#_createModuleFromConfig(config) -> Module
	 * - config (Object): New module config.
	 * - config.module (Object): Required meta data about the new module to create.
	 * - config.module.type (String): Type or class name of the new module.
	 * - config.module.options (Object): Optional options hash to pass in to the new module's init() method.
	 * - config.module.template (String): Name of the client side template used to render this new module.
	 *
	 * - config.container (Object): Optional meta data about the HTML element that will contain this new module.
	 * - config.container.selector (String): The optional CSS selector identifying the container. Defaults to the <body> tag.
	 * - config.container.insert (String): Values (top|bottom). Determines where the new root element for this module will
	 *                                     be inserted into the container.
	 *
	 * - config.element (Object): Optional meta data about the root element for this new module.
	 * - config.element.tag (String): Optional name of the HTML tag to create. Defaults to "div".
	 * - config.element.className (String): The optional class name for the new root element. Multiple class names are
	 *                                      separated by a space character.
	 *
	 * Create a new module on the page and append it to a container.
	 **/
	_createModuleFromConfig: function(config) {
		if (!config.module) {
			throw new Error("Missing required config.module");
		}
		else if (!config.module.type) {
			throw new Error("Missing required config.module.type");
		}
		else if (!config.module.template) {
			throw new Error("Missing required config.module.template for type: " + config.module.type);
		}

		config.module.options = config.module.options || {};
		config.container = config.container || {};
		config.container.insert = config.container.insert || "top";
		config.element = config.element || {};
		config.element.tag = config.element.tag || "div";

		var module = null;
		var container = null;
		var selector = "script[data-template=" + config.module.template + "]";
		var template = this.document.querySelector(selector);
		var element = this.document.createElement(config.element.tag);

		if (!template) {
			throw new Error("Failed to find new module template using selector: " + selector);
		}

		if (config.container.selector) {
			container = this.document.querySelector(config.container.selector);
		}
		else {
			container = this.document.getElementsByTagName("body")[0];
		}

		if (!container) {
			throw new Error("Failed to find module container with selector: " + (config.container.selector || "body"));
		}

		module = this.moduleManager.createModule(element, config.module.type, config.module.options || {});
		this.moduleManager.initModuleInContainer(element, container, config.container, template, config.module.type, module);
		module.focus();

		element = template = config = container = null;

		return module;
	},

	handleCreateModule: function(event) {
		this._createModuleFromConfig(event.data);

		return false;
	},

	onControllerRegistered: function(frontController, controllerId) {
	},

	onControllerUnregistered: function(frontController) {
	}

};
/*! foundry 2014-05-16 */
Foundry.pollyfill = function() {
	return new Foundry.PollyfillPromise(Array.prototype.slice.call(arguments));
};

Foundry.PollyfillPromise = function PollyfillPromise(tests) {
	this.callbacks = { afterAll: [], afterEach: [] };
	this.tests = tests || [];
};

Foundry.PollyfillPromise.prototype = {

	callbacks: null,

	tests: null,

	constructor: Foundry.PollyfillPromise,

	afterAll: function(func, context) {
		this.callbacks.afterAll.push({func: func, context: context || null});
		return this;
	},

	afterEach: function(func, context) {
		this.callbacks.afterEach.push({func: func, context: context || null});
		return this;
	},

	fullfill: function() {
		var name = arguments[0],
		    args = Array.prototype.slice.call(arguments, 1),
		    callbacks = this.callbacks[name] || null,
		    callback, i, length;

		if (!name) {
			throw new Error("Missing required argument: name");
		}
		else if (!callbacks) {
			throw new Error("Cannot fullfill invalid promise: " + name);
		}

		for (i = 0, length = callbacks.length; i < length; i++) {
			callback = callbacks[i];
			callback.func.apply(callback.context, args);
		}
	},

	start: function() {
		throw new Error("Not Implemented!");
	}
};
Foundry.PollyfillPromise.prototype.start = function() {
	var i = 0,
	    length = this.tests.length,
	    idx = i,
	    that = this,
	    test;

	for (i; i < length; i++) {
		test = this.tests[i];
		test.callback = callback;
		test.complete = complete;
		yepnope(test);
	}

	function complete() {
		if (++idx === length) {
			that.fullfill("afterAll", arguments);
		}
	}

	function callback() {
		that.fullfill("afterEach", arguments);
	}

	function cleanup() {
		test = that = null;
	}
};

(function(global) {

global.Module = global.Module || {};

var _guid = 0;

function Base() {
	this.initialize();
}

Base.setDefaultModule = function(module) {
	Module.manager.setDefaultModule(module);
};

Base.unregister = function(module) {
	if (!Module.manager) {
		return;
	}

	Module.manager.unregisterModule(module);
};

Base.prototype = {

	controllerId: null,

	document: null,

	element: null,

	guid: null,

	_isLoading: false,

	window: null,

	constructor: Base,

	initialize: function() {
		this.guid = ++_guid;
		this.options = {};
	},

	init: function(elementOrId, options) {
		if (elementOrId) {
			this.setElement(elementOrId);
		}

		if (options) {
			this.setOptions(options);
		}

		if (this.options.defaultModule) {
			Base.setDefaultModule(this);
		}

		return this;
	},

	destructor: function(keepElement) {
		Base.unregister(this);

		if (!keepElement && this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}

		this.element = this.options = this.document = this.window = null;
	},

	focus: function(anything) {
		var element,
			typeRegex = /checkbox|radio|submit|button|image|reset/,
		    selector = [
		    	"textarea",
		    	"select",
		    	"input[type=text]",
		    	"input[type=password]",
		    	"input[type=checkbox]",
		    	"input[type=radio]",
		    	"input[type=email]",
		    	"input[type=number]",
		    	"input[type=search]",
		    	"input[type=url]"
		    ];

		if (anything) {
			selector.push(
				"a",
				"button",
				"input[type=submit]",
				"input[type=button]",
				"input[type=image]",
				"input[type=reset]"
			);
		}

		element = this.element.querySelector(selector.join(", "));

		if (element && element.focus) {
			element.focus();

			if (element.select && !typeRegex.test(element.type)) {
				element.select();
			}
		}

		element = null;
	},

	_loading: function(element) {
		(element || this.element).classList.add("loading");
		this._isLoading = true;
		element = null;
	},

	_loaded: function(element) {
		(element || this.element).classList.remove("loading");
		this._isLoading = false;
		element = null;
	},

	onControllerRegistered: function(frontController, controllerId) {
	},

	onControllerUnregistered: function(frontController) {
	},

	setElement: function(elementOrId) {
		this.element = typeof elementOrId === "string"
		             ? document.getElementById(elementOrId)
		             : elementOrId;

		if (!this.element) {
			throw new Error("Could not find element: " + elementOrId);
		}

		this.document = this.element.ownerDocument;
		this.window = this.document.defaultView || this.document.parentWindow;
	},

	setOptions: function(overrides) {
		for (var key in overrides) {
			if (overrides.hasOwnProperty(key)) {
				this.options[key] = overrides[key];
			}
		}

		overrides = null;
	}

};

global.Module.Base = Base;

})(this);
/*! module-utils 2014-05-14 */
/*! module-utils 2014-05-14 */
(function(global) {

var toString = global.Object.prototype.toString;

function isArray(x) {
	return toString.call(x) === "[object Array]";
}

function merge(source, destination, safe) {
	for (var key in source) {
		if (source.hasOwnProperty(key) && (!safe || !destination.hasOwnProperty(key))) {
			destination[key] = source[key];
		}
	}
}

function includeAll(mixins, Klass) {
	if (!Klass) {
		throw new Error("Missing required argument: Klass");
	}

	mixins = isArray(mixins) ? mixins : [mixins];

	var i = 0, length = mixins.length;

	for (i; i < length; i++) {
		if (!mixins[i]) {
			throw new Error("Mixin at index " + i + " is null or undefined");
		}

		Klass.include(mixins[i]);
	}
}

function include(mixin) {
	var key, Klass = this;

	// include class level methods
	if (mixin.self) {
		merge(mixin.self, Klass, true);
	}

	// include instance level methods
	if (mixin.prototype) {
		merge(mixin.prototype, Klass.prototype, true);
	}

	// include other mixins
	if (mixin.includes) {
		includeAll(mixin.includes, Klass);
	}

	if (mixin.included) {
		mixin.included(Klass);
	}

	mixin = null;
}

function extend(descriptor) {
	descriptor = descriptor || {};

	var key, i, length, ParentKlass = this;

	// Constructor function for our new class
	var ChildKlass = function ChildKlass() {
		this.initialize.apply(this, arguments);
	};

	// "inherit" class level methods
	merge(ParentKlass, ChildKlass);

	// new class level methods
	if (descriptor.self) {
		merge(descriptor.self, ChildKlass);
	}

	// Set up true prototypal inheritance
	ChildKlass.prototype = Object.create(ParentKlass.prototype);

	// new instance level methods
	if (descriptor.prototype) {
		merge(descriptor.prototype, ChildKlass.prototype);
	}

	// apply mixins
	if (descriptor.includes) {
		includeAll(descriptor.includes, ChildKlass);
	}

	ChildKlass.prototype.initialize = ChildKlass.prototype.initialize || function initialize() {};
	ChildKlass.prototype.constructor = ChildKlass;

	ParentKlass = descriptor = null;

	return ChildKlass;
}

// Make "include" available to the World
if (!global.Function.prototype.include) {
	global.Function.prototype.include = include;
}

// Make "extend" available to the World
if (!global.Function.prototype.extend) {
	if (global.Object.extend) {
		// Some JavaScript libraries already have an "extend" function
		global.Object._extend = extend;
	}

	global.Function.prototype.extend = extend;
}

})(this);

function Callbacks(context, types) {
	if (context) {
		this.context = context;
		this.types = types || {};
	}
}

Callbacks.prototype = {

	context: null,

	types: null,

	destructor: function destructor() {
		this.context = this.types = null;
	},

	add: function add(name, method) {
		if (!this.types[name]) {
			this.types[name] = [];
		}

		this.types[name].push(method);

		return this;
	},

	execute: function execute(name) {
		if (!this.types[name]) {
			return true;
		}

		var args = Array.prototype.slice.call(arguments, 1, arguments.length);
		var method, i = 0, length = this.types[name].length;
		var success = true;

		for (i; i < length; i++) {
			method = this.types[name][i];

			if (!this.context[method]) {
				throw new Error("No callback method found: " + method);
			}

			if (this.context[method].apply(this.context, args) === false) {
				success = false;
				break;
			}
		}

		return success;
	},

	remove: function remove(name, method) {
		if (!this.types[name]) {
			return;
		}

		var i = 0, length = this.types[name].length, m;

		for (i; i < length; i++) {
			if (method === this.types[name][i]) {
				this.types[name].splice(i, 1);
				break;
			}
		}

		return this;
	}

};

Callbacks.Utils = {
	self: {
		addCallback: function addCallback(name, method) {
			this.prototype.callbacks = this.prototype.callbacks || {};

			if (!this.prototype.callbacks[name]) {
				this.prototype.callbacks[name] = [];
			}
			else if (!this.prototype.callbacks[name] instanceof Array) {
				this.prototype.callbacks[name] = [this.prototype.callbacks[name]];
			}

			this.prototype.callbacks[name].push(method);

			return this;
		}
	},

	prototype: {
		callbacks: null,

		initCallbacks: function initCallbacks(types) {
			if (!this.hasOwnProperty("callbacks")) {
				this.callbacks = new Callbacks(this);
			}

			if (types) {
				this.callbacks.types = types;
			}
		},

		destroyCallbacks: function destroyCallbacks() {
			if (this.callbacks) {
				this.callbacks.destructor();
				this.callbacks = null;
			}
		}
	}
};

Module.Utils = {
	include: function(mixin) {
		if (Module.Base)
			Module.Base.include(mixin);
	}
};

Module.Utils.Bootstrap = {
	includes: [
		Callbacks.Utils
	],

	included: function(Klass) {
		// Forcefully override methods
		var proto = Klass.prototype;

		if (proto.initialize !== Module.Utils.Bootstrap.prototype.initialize) {
			proto._originalInitialize = proto.initialize || function emptyInitialize() {};
			proto.initialize = Module.Utils.Bootstrap.prototype.initialize;
		}
		else {
			proto.initialize = function emptyInitialize() {};
		}

		if (proto.init !== Module.Utils.Bootstrap.prototype.init) {
			proto._originalInit = proto.init || function emptyInit() {};
			proto.init = Module.Utils.Bootstrap.prototype.init;
		}
		else {
			proto.init = function emptyInit() {};
		}

		if (proto.destructor !== Module.Utils.Bootstrap.prototype.destructor) {
			proto._originalDestructor = proto.destructor || function emptyDestructor() {};
			proto.destructor = Module.Utils.Bootstrap.prototype.destructor;
		}
		else {
			proto.destructor = function emptyDestructor() {};
		}

		proto = null;
	},

	prototype: {

		initialize: function() {
			this._originalInitialize.call(this);
			this.setOptions(this.mergeProperty("options"));
		},

		init: function(elementOrId, options) {
			this._originalInit.call(this, elementOrId, options);
			this.initCallbacks(this.mergeProperty("callbacks"));
			this.callbacks.execute("beforeReady");
			this._ready();
			this.callbacks.execute("afterReady");

			if (!this._isLoading) {
				this._loaded();
			}

			return this;
		},

		destructor: function(keepElement) {
			this.callbacks.execute("destroy", keepElement);
			this.destroyCallbacks();
			this._originalDestructor.call(this, keepElement);
		},

		_ready: function() {
		},

		cancel: function(event, element, params) {
			event.stop();
			this.destructor();
			event = element = params = null;
		}

	}

};

Module.Utils.include(Module.Utils.Bootstrap);

Module.Utils.PropertyCache = {

	self: {

		cache: null,

		fromCache: function() {
			var toString = Object.prototype.toString,
			    isArray = function(x) { return toString.call(x) === "[object Array]"; };

			function defaultMerge(destination, source, key, klass) {
				var name, value, i, length;

				for (name in source) {
					if (source.hasOwnProperty(name)) {
						value = source[name];

						if (isArray(value)) {
							if (!destination[name]) {
								destination[name] = value;
							}
							else {
								destination[name] = destination[name] || [];

								for (i = 0, length = value.length; i < length; i++) {
									if (destination[name].indexOf(value[i]) < 0) {
										destination[name].unshift(value[i]);
									}
								}
							}
						}
						else if (!destination.hasOwnProperty(name)) {
							destination[name] = source[name];
						}
					}
				}
			}

			return function fromCache(key, name, callback, context) {
				this.cache = this.cache || {};

				if (this.cache[key]) {
					return this.cache[key];
				}

				if (!callback) {
					callback = defaultMerge;
					context = this;
				}
				else {
					context = context || null;
				}

				var proto = this.prototype, value = {};

				while (proto) {
					if (proto.hasOwnProperty(name) && proto[name]) {
						callback.call(context, value, proto[name], key, this);
					}

					proto = proto.__proto__;
				}

				return (this.cache[key] = value);
			};
		}()

	},

	prototype: {

		mergeProperty: function mergeProperty(name, callback, context) {
			var key = this.guid ? this.guid + "." + name : name;
			return this.constructor.fromCache(key, name, callback, context);
		}

	}

};

Module.Utils.include(Module.Utils.PropertyCache);

Module.Utils.Rendering = {

	included: function(Klass) {
		Klass.addCallback("destroy", "_destroyRenderingEngine");
	},

	prototype: {

		renderingEngine: null,

		_destroyRenderingEngine: function _destroyRenderingEngine() {
			this.renderingEngine = null;
		},

		render: function render(name, data, elementOrId) {
			return this.renderingEngine.render(name, data, elementOrId);
		}

	}

};

Module.Utils.include(Module.Utils.Rendering);

/*! module-utils 2014-05-14 */
function ElementStore() {
}
ElementStore.prototype = {

	_cache: null,

	config: null,

	_document: null,

	returnNative: false,

	_root: null,

	constructor: ElementStore,

	init: function init(root) {
		if (!root) {
			throw new Error("Missing required argument: root");
		}

		this.config = this.config || { elements: {}, collections: {} };
		this._cache = {};
		this.setRoot(root);

		if (!this.createElement) {
			this.createElement = this._createElement;
		}

		if (!this.parseHTML) {
			this.parseHTML = this._parseHTML;
		}

		if (!this.querySelector) {
			this.querySelector = this._querySelector;
		}

		if (!this.querySelectorAll) {
			this.querySelectorAll = this._querySelectorAll;
		}

		this.eagerLoad();

		return this;
	},

	destructor: function destructor() {
		if (this._cache) {
			this.clearCache();
			this._cache = null;
		}

		this.config = this._root = this._document = null;
	},

	clearCache: function clearCache() {
		var key;

		for (key in this._cache) {
			if (this._cache.hasOwnProperty(key)) {
				this._cache[key] = null;
			}
		}

		return this;
	},

	_createElement: function _createElement(tagName) {
		return this._document.createElement(tagName);
	},

	eagerLoad: function eagerLoad() {
		var key, conf;

		for (key in this.config.elements) {
			if (this.config.elements.hasOwnProperty(key)) {
				conf = this.config.elements[key];

				if (conf.eager && !conf.nocache) {
					this._cache[key] = this.getElement(key);
				}
			}
		}

		for (key in this.config.collections) {
			if (this.config.collections.hasOwnProperty(key)) {
				conf = this.config.collections[key];

				if (conf.eager && !conf.nocache) {
					this.getCollection(key);
				}
			}
		}

		return this;
	},

	get: function get(key) {
		return this.getElement(key) || this.getCollection(key) || null;
	},

	getCollection: function getCollection(key) {
		var collection;

		if (!this.config.collections[key]) {
			collection = null;
		}
		else if (this._cache[key]) {
			collection = this._cache[key];
		}
		else if (this.config.collections[key].selector) {
			collection = this.querySelectorAll(this.config.collections[key].selector);

			if (!this.config.collections[key].nocache) {
				this._cache[key] = collection;
			}
		}
		else {
			throw new Error("Missing required config \"selector\" for collection " + key);
		}

		return collection;
	},

	getElement: function getElement(key) {
		var element;

		if (!this.config.elements[key]) {
			element = null;
		}
		else if (this._cache[key]) {
			element = this._cache[key];
		}
		else if (this.config.elements[key].selector) {
			element = this.querySelector(this.config.elements[key].selector);

			if (!this.config.elements[key].nocache) {
				this._cache[key] = element;
			}
		}
		else {
			throw new Error("Missing required config \"selector\" for element " + key);
		}

		return element;
	},

	isCollection: function isCollection(key) {
		return this.config.collections.hasOwnProperty(key);
	},

	isElement: function isElement(key) {
		return this.config.elements.hasOwnProperty(key);
	},

	keys: function keys() {
		var keys = [], key;

		for (key in this.config.elements) {
			if (this.config.elements.hasOwnProperty(key)) {
				keys.push(key);
			}
		}

		for (key in this.config.collections) {
			if (this.config.collections.hasOwnProperty(key)) {
				keys.push(key);
			}
		}

		return keys;
	},

	_mergeConfigs: function _mergeConfigs(config, overrides, safe) {
		for (key in overrides) {
			if (overrides.hasOwnProperty(key) && (config[key] === undefined || !safe)) {
				config[key] = overrides[key];
			}
		}
	},

	_parseHTML: function _parseHTML(html) {
		html = html.replace(/^\s+|\s+$/g, "");
		var div = this.createElement("div");
		div.innerHTML = html;
		var elements = [], i = div.childNodes.length;

		while (i--) {
			elements.push(div.childNodes[i]);
			div.removeChild(div.childNodes[i]);
		}

		div = null;

		return elements;
	},

	setConfig: function setConfig(overrides, safe) {
		this.config = this.config || { elements: {}, collections: {} };

		if (overrides.elements) {
			this._mergeConfigs(this.config.elements, overrides.elements, safe)
		}

		if (overrides.collections) {
			this._mergeConfigs(this.config.collections, overrides.collections, safe)
		}

		return this;
	},

	setRoot: function setRoot(root) {
		this.clearCache();
		this._root = root;
		this._document = this._root.nodeName === "#document" ? this._root : this._root.ownerDocument;

		return this;
	},

	toString: function toString() {
		return "[object ElementStore]";
	},

	_querySelector: function _querySelector(selector, element) {
		return (element || this._root).querySelector(selector);
	},

	_querySelectorAll: function _querySelectorAll(selector, element) {
		return (element || this._root).querySelectorAll(selector);
	}

};

// @import Inherit.js
// @requires ElementStore

ElementStore.Utils = {
	prototype: {
		elementStore: {},

		destroyElementStore: function destroyElementStore() {
			if (this.elementStore) {
				this.elementStore.destructor();
				this.elementStore = null;
			}
		},

		initElementStore: function initElementStore(root) {
			if (!this.hasOwnProperty("elementStore")) {
				this.elementStore = new ElementStore();
			}

			this._compileElementStore();
			this._initGetters();
			this.elementStore.init(root);
		},

		_initGetters: function _initGetters() {
			if (this.__proto__.hasOwnProperty("__elementStoreGettersCreated__")) {
				return;
			}

			var key, propertyName, proto = this.__proto__;
			var elements = this.elementStore.config.elements;
			var collections = this.elementStore.config.collections;

			if (!this.createElementGetter) {
				this.createElementGetter = this._createElementGetter;
			}

			if (!this.createCollectionGetter) {
				this.createCollectionGetter = this._createCollectionGetter;
			}

			for (key in elements) {
				if (elements.hasOwnProperty(key)) {
					if (!proto[key]) {
						propertyName = key;
					}
					else if (!proto[key + "Element"]) {
						propertyName = key + "Element";
					}
					else {
						throw new Error("Cannot create element getter: " + key);
					}

					this.createElementGetter(key, propertyName);
				}
			}

			for (key in collections) {
				if (collections.hasOwnProperty(key)) {
					if (!proto[key]) {
						propertyName = key;
					}
					else if (!proto[key + "Collection"]) {
						propertyName = key + "Collection";
					}
					else {
						throw new Error("Cannot create collection getter: " + key);
					}

					this.createCollectionGetter(key, propertyName);
				}
			}

			proto.__elementStoreGettersCreated__ = true;

			elements = collections = proto = null;
		},

		clearElementStoreCache: function clearElementStoreCache() {
			this.elementStore.clearCache();
		},

		collection: function collection(key) {
			return this.elementStore.getCollection(key);
		},

		_compileElementStore: function _compileElementStore() {
			if (this.__proto__.hasOwnProperty("_compiledElementStore")) {
				// Use the cached config
				this.elementStore.setConfig(this.__proto__._compiledElementStore);

				return;
			}

			var proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("elementStore")) {
					this.elementStore.setConfig(proto.elementStore, true);
				}

				proto = proto.__proto__;
			}

			// Cache this config for later instances
			this.__proto__._compiledElementStore = this.elementStore.config;
		},

		_createCollectionGetter: function _createCollectionGetter(key, propertyName) {
			var getter = function collectionGetter() {
				return this.elementStore.getCollection(key);
			};

			this.__proto__[propertyName] = getter;
		},

		_createElementGetter: function _createElementGetter(key, propertyName) {
			var getter = function elementGetter() {
				return this.elementStore.getElement(key);
			};

			this.__proto__[propertyName] = getter;
		},

		element: function element(key) {
			return this.elementStore.getElement(key);
		}
	}
};

Module.Utils.ElementStore = {

	includes: [
		ElementStore.Utils
	],

	included: function(Klass) {
		Klass.addCallback("beforeReady", "_initElementStore");
		Klass.addCallback("destroy", "destroyElementStore");
	},

	prototype: {
		_initElementStore: function _initElementStore() {
			this.initElementStore(this.element);
		}
	}

};

Module.Utils.include(Module.Utils.ElementStore);

/*! module-utils 2014-05-14 */
(function() {

	function include(Klass, mixin) {
		if (mixin.self) {
			merge(mixin.self, Klass, true);
		}

		if (mixin.prototype) {
			merge(mixin.prototype, Klass.prototype, true);
		}

		if (mixin.included) {
			mixin.included(Klass);
		}
	}

	function merge(source, destination, safe) {
		var key, undef;

		for (key in source) {
			if (source.hasOwnProperty(key) &&
				(!safe || destination[key] === undef)) {
				destination[key] = source[key];
			}
		}

		source = destination = null;
	}

	var Beacon = {
		setup: function setup(Klass) {
			if (Beacon.ApplicationEvents) {
				include(Klass, Beacon.ApplicationEvents);

				if (Beacon.Notifications) {
					include(Klass, Beacon.Notifications);
				}
			}
		}
	};

	window.Beacon = Beacon;

})();

Beacon = (function(Beacon) {

	function Dispatcher() {
		this._subscribers = {};
	}

	Dispatcher.prototype = {

		_subscribers: null,

		constructor: Dispatcher,

		destructor: function destructor() {
			if (!this._subscribers) {
				return;
			}

			var subscribers = this._subscribers,
			    subscriber,
			    eventType,
			    i, length;

			for (eventType in subscribers) {
				if (subscribers.hasOwnProperty(eventType)) {
					for (i = 0, length = subscribers[eventType].length; i < length; i++) {
						subscriber = subscribers[eventType][i];
						subscriber.callback = subscriber.context = null;
					}

					subscribers[eventType] = null;
				}
			}

			subscriber = subscribers = this._subscribers = null;
		},

		_dispatchEvent: function _dispatchEvent(publisher, data, subscribers) {
			var subscriber,
			    result,
			    i = 0,
			    length = subscribers.length;

			for (i; i < length; i++) {
				subscriber = subscribers[i];

				if (subscriber.type === "function") {
					result = subscriber.callback.call(subscriber.context, publisher, data);
				}
				else if (subscriber.type === "string") {
					result = subscriber.context[ subscriber.callback ](publisher, data);
				}

				if (result === false) {
					break;
				}
			}

			subscribers = subscriber = publisher = data = null;

			return result !== false;
		},

		publish: function publish(eventType, publisher, data) {
			if (!this._subscribers[eventType]) {
				return true;
			}

			var result = this._dispatchEvent(publisher, data, this._subscribers[eventType]);

			publisher = data = null;

			return result;
		},

		subscribe: function subscribe(eventType, context, callback) {
			var contextType = typeof context;
			var callbackType = typeof callback;

			this._subscribers[eventType] = this._subscribers[eventType] || [];

			if (contextType === "function") {
				this._subscribers[eventType].push({
					context: null,
					callback: context,
					type: "function"
				});
			}
			else if (contextType === "object") {
				if (callbackType === "string" && typeof context[ callback ] !== "function") {
					throw new Error("Cannot subscribe to " + eventType + " because " + callback + " is not a function");
				}

				this._subscribers[eventType].push({
					context: context || null,
					callback: callback,
					type: callbackType
				});
			}
		},

		unsubscribe: function unsubscribe(eventType, context, callback) {

			if (this._subscribers[eventType]) {
				var contextType = typeof context,
				    callbackType = typeof callback,
				    subscribers = this._subscribers[eventType],
				    i = subscribers.length,
				    subscriber;

				if (contextType === "function") {
					callback = context;
					context = null;
					callbackType = "function";
				}
				else if (contextType === "object" && callbackType === "undefined") {
					callbackType = "any";
				}

				while (i--) {
					subscriber = subscribers[i];

					if (
					    (callbackType === "any" && subscriber.context === context) ||
						(subscriber.type === callbackType && subscriber.context === context && subscriber.callback === callback)
					) {
						subscribers.splice(i, 1);
					}
				}

				subscribers = subscriber = null;
			}

			context = callback = null;
		},

		unsubscribeAll: function unsubscribeAll(context) {
			var type, i, subscribers;

			for (type in this._subscribers) {
				if (this._subscribers.hasOwnProperty(type)) {
					subscribers = this._subscribers[type];
					i = subscribers.length;

					while (i--) {
						if (subscribers[i].context === context) {
							subscribers.splice(i, 1);
						}
					}
				}
			}

			context = subscribers = null;
		}

	};

	Beacon.Dispatcher = Dispatcher;

	return Beacon;

})(window.Beacon || {});
Beacon = (function(Beacon) {

	var ApplicationEvents = {

		eventDispatcher: null,

		self: {

			getEventDispatcher: function getEventDispatcher() {
				if (!Beacon.ApplicationEvents.eventDispatcher) {
					Beacon.ApplicationEvents.eventDispatcher = new Beacon.Dispatcher();
				}

				return Beacon.ApplicationEvents.eventDispatcher;
			},

			publish: function publish(eventName, publisher, data) {
				return this.getEventDispatcher().publish(eventName, publisher, data);
			},

			subscribe: function subscribe(eventName, context, callback) {
				this.getEventDispatcher().subscribe(eventName, context, callback);
			},

			unsubscribe: function unsubscribe(eventName, context, callback) {
				this.getEventDispatcher().unsubscribe(eventName, context, callback);
			}

		},

		prototype: {

			eventDispatcher: null,

			_initApplicationEvents: function _initApplicationEvents() {
				if (!this.hasOwnProperty("eventDispatcher")) {
					this.eventDispatcher = this.constructor.getEventDispatcher();
				}
			},

			_destroyApplicationEvents: function _destroyApplicationEvents() {
				if (this.eventDispatcher) {
					this.eventDispatcher.unsubscribe(this);
				}
			},

			publish: function publish(eventName, data) {
				return this.eventDispatcher.publish(eventName, this, data);
			},

			subscribe: function subscribe(eventName, context, callback) {
				this.eventDispatcher.subscribe(eventName, context, callback);

				return this;
			},

			unsubscribe: function unsubscribe(eventName, context, callback) {
				this.eventDispatcher.unsubscribe(eventName, context, callback);

				return this;
			}

		}

	};

	Beacon.ApplicationEvents = ApplicationEvents;

	return Beacon;

})(window.Beacon || {});

Beacon = (function(Beacon) {

	var _guid = 0;

	var Notifications = {

		self: {

			addNotifications: function addNotifications(newNotifications) {
				var name, notifications = this.prototype.notifications || {};

				for (name in newNotifications) {
					if (newNotifications.hasOwnProperty(name)) {
						if (notifications[name]) {
							notifications[name] = (notifications[name] instanceof Array) ? notifications[name] : [ notifications[name] ];
						}
						else {
							notifications[name] = [];
						}

						notifications[name].push( newNotifications[name] );
					}
				}

				this.prototype.notifications = notifications;
				notifications = newNotifications = null;
			}

		},

		prototype: {

			_notificationDispatcher: null,

			_notificationId: null,

			_notificationIdPrefix: "notifications",

			notifications: null,

			_initNotifications: function _initNotifications() {
				if (!this.__proto__.hasOwnProperty("_compiledNotifications")) {
					this._compileNotifications();
				}

				this._initApplicationEvents();

				this._notificationId = _guid++;

				var name, i, length, notifications;

				for (name in this._compiledNotifications) {
					if (this._compiledNotifications.hasOwnProperty(name)) {
						notifications = this._compiledNotifications[name];

						for (i = 0, length = notifications.length; i < length; i++) {
							this.listen( name, this, notifications[i] );
						}
					}
				}

				this._setUpNotifications();
			},

			_compileNotifications: function _compileNotifications() {
				var _compiledNotifications = {}, name, i, length, notifications, proto = this.__proto__;

				while (proto) {
					if (proto.hasOwnProperty("notifications") && proto.notifications) {
						notifications = proto.notifications;

						for (name in notifications) {
							if (notifications.hasOwnProperty(name)) {
								_compiledNotifications[name] = _compiledNotifications[name] || [];
								notifications[name] = notifications[name] instanceof Array ? notifications[name] : [ notifications[name] ];

								// To keep notifications executing in the order they were defined in the classes,
								// we loop backwards and place the new notifications at the top of the array.
								i = notifications[name].length;
								while (i--) {
									_compiledNotifications[name].unshift( notifications[name][i] );
								}
							}
						}
					}

					proto = proto.__proto__;
				}

				this.__proto__._compiledNotifications = _compiledNotifications;

				proto = notifications = _compiledNotifications = null;
			},

			_destroyNotifications: function _destroyNotifications() {
				if (this._notificationDispatcher) {
					this._notificationDispatcher.destructor();
					this._notificationDispatcher = null;
				}
			},

			_setUpNotifications: function _setUpNotifications() {
				// Child classes may override this to do something special with adding notifications.
			},

			notify: function notify(message, data) {
				var success = this.publish(this._notificationIdPrefix + "." + this._notificationId + "." + message, data);
				data = null;
				return success;
			},

			listen: function listen(message, context, notification) {
				this.subscribe(this._notificationIdPrefix + "." + this._notificationId + "." + message, context, notification);
				context = notification = null;

				return this;
			},

			ignore: function ignore(message, context, notification) {
				this.unsubscribe(this._notificationIdPrefix + "." + this._notificationId + "." + message, context, notification);
				context = notification = null;

				return this;
			}

		}

	};

	Beacon.Notifications = Notifications;

	return Beacon;

})(window.Beacon || {});

Module.Utils.Events = {
	included: function(Klass) {
		Beacon.setup(Klass);
		Klass.addCallback("beforeReady", "_initApplicationEvents");

		if (Beacon.Notifications) {
			Klass.addCallback("beforeReady", "_initNotifications");
		}
	}
};

Module.Utils.include(Module.Utils.Events);

/*! bloodhound 2014-05-14 */
(function() {

	function createCallback(Klass, name) {
		if (name in Klass.prototype) {
			throw new Error("A callback named '" + name + "' has already been defined");
		}

		Klass.prototype[name] = function __PromiseCallback(func, context) {
			if (this._pendingCallbacks[name]) {
				var info = this._pendingCallbacks[name];
				func.apply(context || this.ctx || null, info.args);
				this._pendingCallbacks[name] = info = null;
			}
			else {
				this._callbacks[name] = { fn: func, context: context || null };
			}

			return this;
		};
	}

	function Promise(promiser) {
		this.promiser = promiser || null;
		this.ctx = null;
		this._callbacks = {};
		this._pendingCallbacks = {};
	}

	Promise.create = function create(ParentPromise, callbackNames) {
		if (!arguments.length) {
			throw new Error("Missing required argument: callbackNames (Array<String>)");
		}
		else if (!callbackNames) {
			callbackNames = ParentPromise;
			ParentPromise = Promise;
		}

		function ChildPromise() {
			ParentPromise.apply(this, arguments);
		}

		ChildPromise.create = function create(x) {
			return Promise.create(ChildPromise, x);
		};

		ChildPromise.prototype = new ParentPromise();
		ChildPromise.prototype.constructor = ChildPromise;

		for (var i = 0, length = callbackNames.length; i < length; i++) {
			createCallback(ChildPromise, callbackNames[i]);
		}

		return ChildPromise;
	};

	Promise.prototype = {

		_callbacks: null,

		_pendingCallbacks: null,

		promiser: null,

		constructor: Promise,

		destructor: function destructor() {
			var key;

			if (this._callbacks) {
				for (key in this._callbacks) {
					if (!this._callbacks.hasOwnProperty(key)) {continue;}
					this._callbacks[key] = null;
				}

				this._callbacks = null;
			}

			if (this._pendingCallbacks) {
				for (key in this._pendingCallbacks) {
					if (!this._pendingCallbacks.hasOwnProperty(key)) {continue;}
					this._pendingCallbacks[key] = null;
				}

				this._pendingCallbacks = null;
			}

			this.promiser = null;
		},

		callbackDefined: function callbackDefined(name) {
			return (this.__proto__[name] && this.__proto__[name].name === "__PromiseCallback") ? true : false;
		},

		context: function context(ctx) {
			this.ctx = ctx;

			return this;
		},

		fulfill: function fulfill() {
			if (arguments.length === 0) {
				throw new Error("The first argument to Promise#fulfill must be the name of the promise to fulfill");
			}

			var name = arguments[0],
			    callback = this._callbacks[name],
			    args = Array.prototype.slice.call(arguments, 1, arguments.length) || [];

			args.push(this.promiser, this);

			if (callback) {
				callback.fn.apply(callback.context || this.ctx || null, args);
			}
			else {
				this._pendingCallbacks[name] = { args: args };
			}

			return this;
		}

	};

	window.Promise = Promise;

})();

(function() {

var Bloodhound = {

	Adapters: {},

	RenderingEngines: {},

	ViewProviders: {},

	ViewResolvers: {},

	RenderPromise: Promise.create(["done"])

};

window.Bloodhound = Bloodhound;

})();

/*! bloodhound 2014-05-14 */
(function() {

function DynamicRenderingEngine(viewResolver) {
	this.viewResolver = viewResolver || null;
}

DynamicRenderingEngine.prototype.viewResolver = null;

DynamicRenderingEngine.prototype.render = function render(name, data, elementOrId) {
	var promise = new Bloodhound.RenderPromise(this),
	    element = null,
	    doc = this.viewResolver.getDocument();

	if (elementOrId) {
		if (typeof elementOrId === "string") {
			element = doc.getElementById(elementOrId);

			if (!element) {
				throw new Error("Failed to find element '" + elementOrId + "' in document: " + (doc.documentURI || doc.location));
			}
		}
		else {
			element = elementOrId;
		}
	}

	this.viewResolver.find(name, function(template) {
		var result = template.render(data);

		if (element) {
			element.innerHTML = result;
		}

		promise.fulfill("done", result, template, element);

		element = template = data = null;
	});

	return promise;
};

Bloodhound.RenderingEngines.DynamicRenderingEngine = DynamicRenderingEngine;

})();

(function() {

/**
 * class Bloodhound.ViewResolvers.DynamicViewResolver < Bloodhound.ViewResolvers.IDynamicViewResolver
 *
 * This class allows you to resolve views that are either embedded in the
 * HTML document, or fetched in via AJAX.
 *
 * Example (Embedded Templates, inherited from Bloodhound.ViewResolvers.IViewResolver)
 *
 *     <script type="text/html" data-template-name="foo">
 *         <p>Foo: {{foo}}</p>
 *     </script>
 *
 * You may also trigger an AJAX call to an arbitrary URL by utilizing the
 * data-template-url attribute on the <script/> tag:
 *
 * Example (AJAX templates, custom URL):
 *
 *     <script type="text/html" data-template-name="foo"
 *         data-template-url="/path/to/foo.tpl"></script>
 *
 * The last method involves using a convention based mapping of view names
 * to URLs:
 *
 * Example (AJAX templates with URL convention):
 *
 *     viewResolver.find("blogs/posts/detail", function(template) {
 *         // use "template"
 *     });
 *
 * The view named "blogs/posts/detail" by default makes an AJAX call to
 * /js/app/views/blogs/posts/detail.tpl to fetch the source code for that
 * template. You can override the base URL and file extension, which we
 * will discuss later.
 *
 * Below shows how you can use this view resolver and customize it:
 *
 *     <script type="text/javascript">
 *         var provider = new Bloodhound.ViewProviders.MustacheViewProvider();
 *         var viewResolver = new Bloodhound.ViewResolvers.DynamicViewResolver(document, provider);
 *
 *         // Use a non standard base URL for AJAX'd in templates:
 *         viewResolver.templateUrlBase = "/my/custom/url/base";
 *
 *         // Use a non standard file extension for all AJAX'd in templates:
 *         viewResolver.templateExtension = ".mustache";
 *
 *         // Synchronous method call (inherited from Bloodhound.ViewProviders.IViewProvider):
 *         var template = viewResolver.find("foo");
 *
 *         // Asynchronous method call:
 *         viewResolver.find("foo", function(template) {
 *             // do something with "template"
 *         });
 *
 *         // Asynchronous method call, setting value of "this" in callback:
 *         viewResolver.find("foo", function(template) {
 *             // do something with "template"
 *         }, this);
 *     </script>
 *
 * When finding a new template, the steps below are executed:

 * 1) Find the view. If a data-template-url is provided, make a request
 *    to that URL, otherwise build a URL based on the templateUrlBase,
 *    and templateExtension properties and the template name.
 * 2) Make the AJAX request. If a 200 status is returned from the server,
 *    then pass the responseText and name into the viewProvider and get
 *    back an implementation of Bloodhound.ITemplate. If a non 200 HTTP
 *    status is returned, throw an error.
 * 3) Have the view provider inspect the template source code for sub
 *    templates or partials. If they exist, fetch those from the server.
 * 4) Keep fetching sub templates for every sub template fetched until
 *    all sub templates have been fetched and cached as template objects.
 * 5) After all sub templates have been fetched and cached, invoke the
 *    callback, passing in the original template object for the requested
 *    view.
 *
 * Subsequent calls for the same view will return the cached template
 * objects. You should always provide a callback function when finding
 * views.
 **/
function DynamicViewResolver(container, provider) {

	// Public Properties

	this.httpMethod = "GET";
	this.httpMethodAttribute = "data-template-method";
	this.templateNameAttribute = "data-template-name";
	this.templateExtension = ".tpl";
	this.templateUrlAttribute = "data-template-url";
	this.templateUrlBase = "/js/app/views";

	// Public Methods

	this.addTemplate = addTemplate;
	this.find = find;
	this.getDocument = getDocument;
	this.getTemplate = getTemplate;
	this.getTemplateCache = getTemplateCache;
	this.setContainer = setContainer;
	this.setProvider = setProvider;

	// Private Properties

	var _templates = {},
	    _container = null,
	    _provider = null,
	    _sourceNodeCache = {},
	    self = this;

	// Private Methods

	function initialize(container, provider) {
		if (container) {
			this.setContainer(container);
		}

		if (provider) {
			this.setProvider(provider);
		}
	}

	function addTemplate(name, template) {
		if (_templates[name]) {
			throw new Error("A template named '" + name + "' already exists.")
		}

		_templates[name] = template;
	}

	function fetch(name, callback, context) {
		if (_templates[name]) {
			callback.call(context || null, _templates[name]);
			return;
		}

		var uri = getTemplateURI(name),
		    url = uri.url,
		    method = uri.method,
		    xhr = new XMLHttpRequest();

		var readyStateChanged = function readyStateChanged() {
			if (xhr.readyState !== 4) {
				return;
			}
			else if (xhr.status === 200) {
				fetchSubTemplates(xhr.responseText, function() {
					_templates[name] = _provider.createTemplate(name, xhr.responseText);
					callback.call(context || null, _templates[name]);
					complete();
				});
			}
			else {
				complete();
				throw new Error("Request to fetch template '" + name + "' from URL '" + method + " " + url + "' failed with status: " + this.status);
			}
		};

		var complete = function complete() {
			xhr.onreadystatechange = null;
			xhr = callback = context = uri = null;
		};

		xhr.onreadystatechange = readyStateChanged;
		xhr.open(method, url);
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.send(null);
	}

	function fetchSubTemplates(source, callback) {
		var count = 0;

		var handleTemplateFetched = function(template) {
			count--;
			checkCount();
			template = null;
		};

		var checkCount = function() {
			if (!count) {
				callback.call();
				callback = handleTemplateFetched = checkCount = null;
			}
		};

		_provider.forEachSubTemplate(source, function(name) {
			count++;
			fetch(name, handleTemplateFetched);
		});

		checkCount();
	}

	function find(name, callback, context) {
		context = context || null;

		if (_templates[name]) {
			if (callback) {
				callback.call(context, _templates[name]);
				return;
			}
			else {
				return _templates[name];
			}
		}
		else if (!callback) {
			throw new Error("Cannot find uncached template: " + name);
		}

		var node = getSourceNode(name);

		if (node && !node.getAttribute(self.templateUrlAttribute)) {
			fetchSubTemplates(node.innerHTML, function() {
				_templates[name] = _provider.createTemplate(name, node.innerHTML);
				callback.call(context, _templates[name]);
			});
		}
		else {
			fetch(name, function(template) {
				callback.call(context, template);
			});
		}
	}

	function getDocument() {
		return _container.ownerDocument || _container;
	}

	function getSourceNode(name, container) {
		container = container || _container;

		if (_sourceNodeCache[name]) {
			return _sourceNodeCache[name];
		}

		var scripts = container.getElementsByTagName("script"),
		    i = scripts.length;

		while (i--) {
			if (scripts[i].getAttribute(self.templateNameAttribute) === name) {
				_sourceNodeCache[name] = scripts[i];
				break;
			}
		}

		scripts = container = null;

		return _sourceNodeCache[name] || null;
	}

	function getTemplate(name) {
		return _templates[name] || null;
	}

	function getTemplateCache() {
		return _templates;
	}

	function getTemplateURI(name) {
		var url = "",
		    method = self.httpMethod,
		    node = getSourceNode(name);

		if (node) {
			url = node.getAttribute(self.templateUrlAttribute);

			if (!url) {
				throw new Error("Missing required attribute " + self.templateUrlAttribute + " on <script type='text/html' " + self.templateNameAttribute + "='" + name + "' />");
			}

			method = node.getAttribute(self.httpMethodAttribute) || self.httpMethod;
		}
		else {
			url = self.templateUrlBase
			    + (/^\//.test(name) ? name : "/" + name)
			    + self.templateExtension;
		}

		url += (/^\?/.test(url) ? "&" : "?") + "__cache__=" + DynamicViewResolver.cacheBuster;

		return {
			url: url,
			method: method.toUpperCase()
		};
	}

	function setContainer(elementOrId) {
		_container = typeof elementOrId === "string"
		           ? document.getElementById(elementOrId)
		           : elementOrId;
	}

	function setProvider(provider) {
		_provider = provider;
		_provider.viewResolver = self;
	}

	// call constructor
	initialize.call(this, container, provider);

};

DynamicViewResolver.cacheBuster = new Date().getTime();

Bloodhound.ViewResolvers.DynamicViewResolver = DynamicViewResolver;

})();

/*! bloodhound 2014-05-14 */
(function() {

function MustacheTemplate(name, source) {
	this.partials = [];
	this.name = name || null;

	if (source) {
		this.setSource(source);
	}
}

MustacheTemplate.prototype = {

	name: null,

	partials: null,

	source: null,

	viewResolver: null,

	constructor: MustacheTemplate,

	getPartials: function getPartials(partials) {
		if (!this.partials.length) {
			return null;
		}

		partials = partials || {};

		var name, template, i = 0,
		    length = this.partials.length;

		for (i; i < length; i++) {
			name = this.partials[i];
			template = this.viewResolver.find(name);
			partials[name] = template.source;
			template.getPartials(partials);
		}

		return partials;
	},

	render: function render(data) {
		return Mustache.render(this.source, data, this.getPartials());
	},

	setSource: function setSource(source) {
		var partials = this.partials;

		this.source = source;

		source.replace(/\{\{>\s*([-\w.\/]+)\s*\}\}/g, function(tag, partial) {
			partials.push(partial);
		});
	},

	setViewResolver: function setViewResolver(viewResolver) {
		this.viewResolver = viewResolver;
		viewResolver = null;
	}

};

Bloodhound.Adapters.MustacheTemplate = MustacheTemplate;

})();

(function() {

var _partialsRegex = /\{\{>\s*([-\w\/.]+)/g;

function MustacheViewProvider(viewResolver) {
	this.viewResolver = viewResolver || null;
	viewResolver = null;
}

MustacheViewProvider.prototype.createTemplate = function createTemplate(name, source) {
	var template = new Bloodhound.Adapters.MustacheTemplate(name, source);
	template.viewResolver = this.viewResolver;
	return template;
};

MustacheViewProvider.prototype.forEachSubTemplate = function forEachSubTemplate(source, callback, context) {
	source.replace(_partialsRegex, function(tag, templateName) {
		callback.call(context, templateName);
	});
};

Bloodhound.ViewProviders.MustacheViewProvider = MustacheViewProvider;

})();
