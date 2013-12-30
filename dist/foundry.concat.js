/*! foundry 2013-12-30 */
/*!
 * Modernizr v2.7.1
 * www.modernizr.com
 *
 * Copyright (c) Faruk Ates, Paul Irish, Alex Sexton
 * Available under the BSD and MIT licenses: www.modernizr.com/license/
 */

/*
 * Modernizr tests which native CSS3 and HTML5 features are available in
 * the current UA and makes the results available to you in two ways:
 * as properties on a global Modernizr object, and as classes on the
 * <html> element. This information allows you to progressively enhance
 * your pages with a granular level of control over the experience.
 *
 * Modernizr has an optional (not included) conditional resource loader
 * called Modernizr.load(), based on Yepnope.js (yepnopejs.com).
 * To get a build that includes Modernizr.load(), as well as choosing
 * which tests to include, go to www.modernizr.com/download/
 *
 * Authors        Faruk Ates, Paul Irish, Alex Sexton
 * Contributors   Ryan Seddon, Ben Alman
 */

window.Modernizr = (function( window, document, undefined ) {

    var version = '2.7.1',

    Modernizr = {},

    /*>>cssclasses*/
    // option for enabling the HTML classes to be added
    enableClasses = true,
    /*>>cssclasses*/

    docElement = document.documentElement,

    /**
     * Create our "modernizr" element that we do most feature tests on.
     */
    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    /**
     * Create the input element for various Web Forms feature tests.
     */
    inputElem /*>>inputelem*/ = document.createElement('input') /*>>inputelem*/ ,

    /*>>smile*/
    smile = ':)',
    /*>>smile*/

    toString = {}.toString,

    // TODO :: make the prefixes more granular
    /*>>prefixes*/
    // List of property values to set for css tests. See ticket #21
    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
    /*>>prefixes*/

    /*>>domprefixes*/
    // Following spec is to expose vendor-specific style properties as:
    //   elem.style.WebkitBorderRadius
    // and the following would be incorrect:
    //   elem.style.webkitBorderRadius

    // Webkit ghosts their properties in lowercase but Opera & Moz do not.
    // Microsoft uses a lowercase `ms` instead of the correct `Ms` in IE8+
    //   erik.eae.net/archives/2008/03/10/21.48.10/

    // More here: github.com/Modernizr/Modernizr/issues/issue/21
    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),
    /*>>domprefixes*/

    /*>>ns*/
    ns = {'svg': 'http://www.w3.org/2000/svg'},
    /*>>ns*/

    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, // used in testing loop


    /*>>teststyles*/
    // Inject element with style element and some CSS rules
    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node, docOverflow,
          div = document.createElement('div'),
          // After page load injecting a fake body doesn't work so check if body exists
          body = document.body,
          // IE6 and 7 won't return offsetWidth or offsetHeight unless it's in the body element, so we fake it.
          fakeBody = body || document.createElement('body');

      if ( parseInt(nodes, 10) ) {
          // In order not to give false positives we create a node for each test
          // This also allows the method to scale for unspecified uses
          while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

      // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
      // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
      // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
      // msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
      // Documents served as xml will throw if using &shy; so use xml friendly encoded version. See issue #277
      style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
      // IE6 will false positive on some tests due to the style element inside the test div somehow interfering offsetHeight, so insert it into body or fakebody.
      // Opera will act all quirky when injecting elements in documentElement when page is served as xml, needs fakebody too. #270
      (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
          //avoid crashing IE8, if background image is used
          fakeBody.style.background = '';
          //Safari 5.13/5.1.4 OSX stops loading if ::-webkit-scrollbar is used and scrollbars are visible
          fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
      // If this is done after page load we don't want to remove the body so check if body exists
      if ( !body ) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }

      return !!ret;

    },
    /*>>teststyles*/

    /*>>mq*/
    // adapted from matchMedia polyfill
    // by Scott Jehl and Paul Irish
    // gist.github.com/786768
    testMediaQuery = function( mq ) {

      var matchMedia = window.matchMedia || window.msMatchMedia;
      if ( matchMedia ) {
        return matchMedia(mq).matches;
      }

      var bool;

      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function( node ) {
        bool = (window.getComputedStyle ?
                  getComputedStyle(node, null) :
                  node.currentStyle)['position'] == 'absolute';
      });

      return bool;

     },
     /*>>mq*/


    /*>>hasevent*/
    //
    // isEventSupported determines if a given element supports the given event
    // kangax.github.com/iseventsupported/
    //
    // The following results are known incorrects:
    //   Modernizr.hasEvent("webkitTransitionEnd", elem) // false negative
    //   Modernizr.hasEvent("textInput") // in Webkit. github.com/Modernizr/Modernizr/issues/333
    //   ...
    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

        // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
        var isSupported = eventName in element;

        if ( !isSupported ) {
          // If it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
          if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

            // If property was created, "remove it" (by setting value to `undefined`)
            if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),
    /*>>hasevent*/

    // TODO :: Add flag for hasownprop ? didn't last time

    // hasOwnProperty shim by kangax needed for Safari 2.0 support
    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { /* yes, this can give false positives/negatives, but most of the time we don't care about those */
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }

    // Adapted from ES5-shim https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
    // es5.github.com/#x15.3.4.5

    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    /**
     * setCss applies given styles to the Modernizr DOM node.
     */
    function setCss( str ) {
        mStyle.cssText = str;
    }

    /**
     * setCssAll extrapolates all vendor-specific css strings.
     */
    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    /**
     * is returns a boolean for if typeof obj is exactly type.
     */
    function is( obj, type ) {
        return typeof obj === type;
    }

    /**
     * contains returns a boolean for if substr is found within str.
     */
    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    /*>>testprop*/

    // testProps is a generic CSS / DOM property test.

    // In testing support for a given CSS property, it's legit to test:
    //    `elem.style[styleName] !== undefined`
    // If the property is supported it will return an empty string,
    // if unsupported it will return undefined.

    // We'll take advantage of this quick test and skip setting a style
    // on our modernizr element, but instead just testing undefined vs
    // empty string.

    // Because the testing of the CSS property names (with "-", as
    // opposed to the camelCase DOM properties) is non-portable and
    // non-standard but works in WebKit and IE (but not Gecko or Opera),
    // we explicitly reject properties with dashes so that authors
    // developing in WebKit or IE first don't end up with
    // browser-specific content by accident.

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }
    /*>>testprop*/

    // TODO :: add testDOMProps
    /**
     * testDOMProps is a generic DOM property test; if a browser supports
     *   a certain property, it won't return undefined for it.
     */
    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                // return the property name as a string
                if (elem === false) return props[i];

                // let's bind a function
                if (is(item, 'function')){
                  // default to autobind unless override
                  return item.bind(elem || obj);
                }

                // return the unbound function or obj or value
                return item;
            }
        }
        return false;
    }

    /*>>testallprops*/
    /**
     * testPropsAll tests a list of DOM properties we want to check against.
     *   We specify literally ALL possible (known and/or likely) properties on
     *   the element including the non-vendor prefixed one, for forward-
     *   compatibility.
     */
    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

        // did they call .prefixed('boxSizing') or are we just testing a prop?
        if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

        // otherwise, they called .prefixed('requestAnimationFrame', window[, elem])
        } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }
    /*>>testallprops*/


    /**
     * Tests
     * -----
     */

    // The *new* flexbox
    // dev.w3.org/csswg/css3-flexbox

    tests['flexbox'] = function() {
      return testPropsAll('flexWrap');
    };

    // The *old* flexbox
    // www.w3.org/TR/2009/WD-css3-flexbox-20090723/

    tests['flexboxlegacy'] = function() {
        return testPropsAll('boxDirection');
    };

    // On the S60 and BB Storm, getContext exists, but always returns undefined
    // so we actually have to call getContext() to verify
    // github.com/Modernizr/Modernizr/issues/issue/97/

    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };

    // webk.it/70117 is tracking a legit WebGL feature detect proposal

    // We do a soft detect which may false positive in order to avoid
    // an expensive context creation: bugzil.la/732441

    tests['webgl'] = function() {
        return !!window.WebGLRenderingContext;
    };

    /*
     * The Modernizr.touch test only indicates if the browser supports
     *    touch events, which does not necessarily reflect a touchscreen
     *    device, as evidenced by tablets running Windows 7 or, alas,
     *    the Palm Pre / WebOS (touch) phones.
     *
     * Additionally, Chrome (desktop) used to lie about its support on this,
     *    but that has since been rectified: crbug.com/36415
     *
     * We also test for Firefox 4 Multitouch Support.
     *
     * For more info, see: modernizr.github.com/Modernizr/touch.html
     */

    tests['touch'] = function() {
        var bool;

        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
          bool = true;
        } else {
          injectElementWithStyles(['@media (',prefixes.join('touch-enabled),('),mod,')','{#modernizr{top:9px;position:absolute}}'].join(''), function( node ) {
            bool = node.offsetTop === 9;
          });
        }

        return bool;
    };


    // geolocation is often considered a trivial feature detect...
    // Turns out, it's quite tricky to get right:
    //
    // Using !!navigator.geolocation does two things we don't want. It:
    //   1. Leaks memory in IE9: github.com/Modernizr/Modernizr/issues/513
    //   2. Disables page caching in WebKit: webk.it/43956
    //
    // Meanwhile, in Firefox < 8, an about:config setting could expose
    // a false positive that would throw an exception: bugzil.la/688158

    tests['geolocation'] = function() {
        return 'geolocation' in navigator;
    };


    tests['postmessage'] = function() {
      return !!window.postMessage;
    };


    // Chrome incognito mode used to throw an exception when using openDatabase
    // It doesn't anymore.
    tests['websqldatabase'] = function() {
      return !!window.openDatabase;
    };

    // Vendors had inconsistent prefixing with the experimental Indexed DB:
    // - Webkit's implementation is accessible through webkitIndexedDB
    // - Firefox shipped moz_indexedDB before FF4b9, but since then has been mozIndexedDB
    // For speed, we don't test the legacy (and beta-only) indexedDB
    tests['indexedDB'] = function() {
      return !!testPropsAll("indexedDB", window);
    };

    // documentMode logic from YUI to filter out IE8 Compat Mode
    //   which false positives.
    tests['hashchange'] = function() {
      return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    // Per 1.6:
    // This used to be Modernizr.historymanagement but the longer
    // name has been deprecated in favor of a shorter and property-matching one.
    // The old API is still available in 1.6, but as of 2.0 will throw a warning,
    // and in the first release thereafter disappear entirely.
    tests['history'] = function() {
      return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };

    // FF3.6 was EOL'ed on 4/24/12, but the ESR version of FF10
    // will be supported until FF19 (2/12/13), at which time, ESR becomes FF17.
    // FF10 still uses prefixes, so check for it until then.
    // for more ESR info, see: mozilla.org/en-US/firefox/organizations/faq/
    tests['websockets'] = function() {
        return 'WebSocket' in window || 'MozWebSocket' in window;
    };


    // css-tricks.com/rgba-browser-support/
    tests['rgba'] = function() {
        // Set an rgba() color and check the returned value

        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function() {
        // Same as rgba(), in fact, browsers re-map hsla() to rgba() internally,
        //   except IE9 who retains it as hsla

        setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function() {
        // Setting multiple images AND a color on the background shorthand property
        //  and then querying the style.background property value for the number of
        //  occurrences of "url(" is a reliable method for detecting ACTUAL support for this!

        setCss('background:url(https://),url(https://),red url(https://)');

        // If the UA supports multiple backgrounds, there should be three occurrences
        //   of the string "url(" in the return value for elemStyle.background

        return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };



    // this will false positive in Opera Mini
    //   github.com/Modernizr/Modernizr/issues/396

    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };


    // Super comprehensive table about all the unique implementations of
    // border-radius: muddledramblings.com/table-of-css3-border-radius-compliance

    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    // WebOS unfortunately false positives on this test.
    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    // FF3.0 will false positive on this test
    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
        // Browsers that actually have CSS Opacity implemented have done so
        //  according to spec, which means their return values are within the
        //  range of [0.0,1.0] - including the leading zero.

        setCssAll('opacity:.55');

        // The non-literal . in this regex is intentional:
        //   German Chrome returns this value as 0,55
        // github.com/Modernizr/Modernizr/issues/#issue/59/comment/516632
        return (/^0.55$/).test(mStyle.opacity);
    };


    // Note, Android < 4 will pass this test, but can only animate
    //   a single property at a time
    //   daneden.me/2011/12/putting-up-with-androids-bullshit/
    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function() {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function() {
        /**
         * For CSS Gradients syntax, please see:
         * webkit.org/blog/175/introducing-css-gradients/
         * developer.mozilla.org/en/CSS/-moz-linear-gradient
         * developer.mozilla.org/en/CSS/-moz-radial-gradient
         * dev.w3.org/csswg/css3-images/#gradients-
         */

        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
             // legacy webkit syntax (FIXME: remove when syntax not in use anymore)
              (str1 + '-webkit- '.split(' ').join(str2 + str1) +
             // standard syntax             // trailing 'background-image:'
              prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function() {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function() {
        return !!testPropsAll('transform');
    };


    tests['csstransforms3d'] = function() {

        var ret = !!testPropsAll('perspective');

        // Webkit's 3D transforms are passed off to the browser's own graphics renderer.
        //   It works fine in Safari on Leopard and Snow Leopard, but not in Chrome in
        //   some conditions. As a result, Webkit typically recognizes the syntax but
        //   will sometimes throw a false positive, thus we must do a more thorough check:
        if ( ret && 'webkitPerspective' in docElement.style ) {

          // Webkit allows this media query to succeed only if the feature is enabled.
          // `@media (transform-3d),(-webkit-transform-3d){ ... }`
          injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
            ret = node.offsetLeft === 9 && node.offsetHeight === 3;
          });
        }
        return ret;
    };


    tests['csstransitions'] = function() {
        return testPropsAll('transition');
    };


    /*>>fontface*/
    // @font-face detection routine by Diego Perini
    // javascript.nwbox.com/CSSSupport/

    // false positives:
    //   WebOS github.com/Modernizr/Modernizr/issues/342
    //   WP7   github.com/Modernizr/Modernizr/issues/538
    tests['fontface'] = function() {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
          var style = document.getElementById('smodernizr'),
              sheet = style.sheet || style.styleSheet,
              cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

          bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };
    /*>>fontface*/

    // CSS generated content detection
    tests['generatedcontent'] = function() {
        var bool;

        injectElementWithStyles(['#',mod,'{font:0/0 a}#',mod,':after{content:"',smile,'";visibility:hidden;font:3px/1 a}'].join(''), function( node ) {
          bool = node.offsetHeight >= 3;
        });

        return bool;
    };



    // These tests evaluate support of the video/audio elements, as well as
    // testing what types of content they support.
    //
    // We're using the Boolean constructor here, so that we can extend the value
    // e.g.  Modernizr.video     // true
    //       Modernizr.video.ogg // 'probably'
    //
    // Codec values from : github.com/NielsLeenheer/html5test/blob/9106a8/index.html#L845
    //                     thx to NielsLeenheer and zcorpan

    // Note: in some older browsers, "no" was a return value instead of empty string.
    //   It was live in FF3.5.0 and 3.5.1, but fixed in 3.5.2
    //   It was also live in Safari 4.0.0 - 4.0.4, but fixed in 4.0.5

    tests['video'] = function() {
        var elem = document.createElement('video'),
            bool = false;

        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('video/ogg; codecs="theora"')      .replace(/^no$/,'');

                // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"') .replace(/^no$/,'');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,'');
            }

        } catch(e) { }

        return bool;
    };

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/,'');

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                bool.wav  = elem.canPlayType('audio/wav; codecs="1"')     .replace(/^no$/,'');
                bool.m4a  = ( elem.canPlayType('audio/x-m4a;')            ||
                              elem.canPlayType('audio/aac;'))             .replace(/^no$/,'');
            }
        } catch(e) { }

        return bool;
    };


    // In FF4, if disabled, window.localStorage should === null.

    // Normally, we could not test that directly and need to do a
    //   `('localStorage' in window) && ` test first because otherwise Firefox will
    //   throw bugzil.la/365772 if cookies are disabled

    // Also in iOS5 Private Browsing mode, attempting to use localStorage.setItem
    // will throw the exception:
    //   QUOTA_EXCEEDED_ERRROR DOM Exception 22.
    // Peculiarly, getItem and removeItem calls do not throw.

    // Because we are forced to try/catch this, we'll go aggressive.

    // Just FWIW: IE8 Compat mode supports these features completely:
    //   www.quirksmode.org/dom/html5.html
    // But IE8 doesn't support either with local files

    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };

    tests['sessionstorage'] = function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };


    tests['webworkers'] = function() {
        return !!window.Worker;
    };


    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    // Thanks to Erik Dahlstrom
    tests['svg'] = function() {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    // specifically for SVG inline in HTML, not within XHTML
    // test page: paulirish.com/demo/inline-svg
    tests['inlinesvg'] = function() {
      var div = document.createElement('div');
      div.innerHTML = '<svg/>';
      return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    // SVG SMIL animation
    tests['smil'] = function() {
        return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };

    // This test is only for clip paths in SVG proper, not clip paths on HTML content
    // demo: srufaculty.sru.edu/david.dailey/svg/newstuff/clipPath4.svg

    // However read the comments to dig into applying SVG clippaths to HTML content here:
    //   github.com/Modernizr/Modernizr/issues/213#issuecomment-1149491
    tests['svgclippaths'] = function() {
        return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    /*>>webforms*/
    // input features and input types go directly onto the ret object, bypassing the tests loop.
    // Hold this guy to execute in a moment.
    function webforms() {
        /*>>input*/
        // Run through HTML5's new input attributes to see if the UA understands any.
        // We're using f which is the <input> element created early on
        // Mike Taylr has created a comprehensive resource for testing these attributes
        //   when applied to all input types:
        //   miketaylr.com/code/input-type-attr.html
        // spec: www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary

        // Only input placeholder is tested while textarea's placeholder is not.
        // Currently Safari 4 and Opera 11 have support only for the input placeholder
        // Both tests are available in feature-detects/forms-placeholder.js
        Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
              // safari false positive's on datalist: webk.it/74252
              // see also github.com/Modernizr/Modernizr/issues/146
              attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
        /*>>input*/

        /*>>inputtypes*/
        // Run through HTML5's new input types to see if the UA understands any.
        //   This is put behind the tests runloop because it doesn't return a
        //   true/false like all the other tests; instead, it returns an object
        //   containing each input type with its corresponding true/false value

        // Big thanks to @miketaylr for the html5 forms expertise. miketaylr.com/
        Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                // We first check to see if the type we give it sticks..
                // If the type does, we feed it a textual value, which shouldn't be valid.
                // If the value doesn't stick, we know there's input sanitization which infers a custom UI
                if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;

                      // Safari 2-4 allows the smiley as a value, despite making a slider
                      bool =  defaultView.getComputedStyle &&
                              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                              // Mobile android web browser has false positive, so must
                              // check the height to see if the widget is actually there.
                              (inputElem.offsetHeight !== 0);

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                      // Spec doesn't define any special parsing or detectable UI
                      //   behaviors so we pass these through as true

                      // Interestingly, opera fails the earlier test, so it doesn't
                      //  even make it here.

                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                      // Real url and email support comes with prebaked validation.
                      bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                      // If the upgraded input compontent rejects the :) text, we got a winner
                      bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        /*>>inputtypes*/
    }
    /*>>webforms*/


    // End of test definitions
    // -----------------------



    // Run through all tests and detect their support in the current UA.
    // todo: hypothetically we could be doing an array of tests and use a basic loop here.
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
            // run the test, throw the return value into the Modernizr,
            //   then based on that boolean, define an appropriate className
            //   and push it into an array of classes we'll join later.
            featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    /*>>webforms*/
    // input tests need to run.
    Modernizr.input || webforms();
    /*>>webforms*/


    /**
     * addTest allows the user to define their own feature tests
     * the result will be added onto the Modernizr object,
     * as well as an appropriate className set on the html element
     *
     * @param feature - String naming the feature
     * @param test - Function returning true if feature is supported, false if not
     */
     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
           // we're going to quit if you're trying to overwrite an existing test
           // if we were to allow it, we'd do this:
           //   var re = new RegExp("\\b(no-)?" + feature + "\\b");
           //   docElement.className = docElement.className.replace( re, '' );
           // but, no rly, stuff 'em.
           return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; // allow chaining.
     };


    // Reset modElem.cssText to nothing to reduce memory footprint.
    setCss('');
    modElem = inputElem = null;

    /*>>shiv*/
    /**
     * @preserve HTML5 Shiv prev3.7.1 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
     */
    ;(function(window, document) {
        /*jshint evil:true */
        /** version */
        var version = '3.7.0';

        /** Preset options */
        var options = window.html5 || {};

        /** Used to skip problem elements */
        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        /** Not all elements can be cloned in IE **/
        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        /** Detect whether the browser supports default html5 styles */
        var supportsHtml5Styles;

        /** Name of the expando, to work with multiple documents or to re-shiv one document */
        var expando = '_html5shiv';

        /** The id for the the documents expando */
        var expanID = 0;

        /** Cached data for each document */
        var expandoData = {};

        /** Detect whether the browser supports unknown elements */
        var supportsUnknownElements;

        (function() {
          try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
            //if the hidden property is implemented we can assume, that the browser supports basic HTML5 Styles
            supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function() {
              // assign a false positive if unable to shiv
              (document.createElement)('a');
              var frag = document.createDocumentFragment();
              return (
                typeof frag.cloneNode == 'undefined' ||
                typeof frag.createDocumentFragment == 'undefined' ||
                typeof frag.createElement == 'undefined'
              );
            }());
          } catch(e) {
            // assign a false positive if detection fails => unable to shiv
            supportsHtml5Styles = true;
            supportsUnknownElements = true;
          }

        }());

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a style sheet with the given CSS text and adds it to the document.
         * @private
         * @param {Document} ownerDocument The document.
         * @param {String} cssText The CSS text.
         * @returns {StyleSheet} The style element.
         */
        function addStyleSheet(ownerDocument, cssText) {
          var p = ownerDocument.createElement('p'),
          parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

          p.innerHTML = 'x<style>' + cssText + '</style>';
          return parent.insertBefore(p.lastChild, parent.firstChild);
        }

        /**
         * Returns the value of `html5.elements` as an array.
         * @private
         * @returns {Array} An array of shived element node names.
         */
        function getElements() {
          var elements = html5.elements;
          return typeof elements == 'string' ? elements.split(' ') : elements;
        }

        /**
         * Returns the data associated to the given document
         * @private
         * @param {Document} ownerDocument The document.
         * @returns {Object} An object of data.
         */
        function getExpandoData(ownerDocument) {
          var data = expandoData[ownerDocument[expando]];
          if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
          }
          return data;
        }

        /**
         * returns a shived element for the given nodeName and document
         * @memberOf html5
         * @param {String} nodeName name of the element
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived element.
         */
        function createElement(nodeName, ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createElement(nodeName);
          }
          if (!data) {
            data = getExpandoData(ownerDocument);
          }
          var node;

          if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
          } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
          } else {
            node = data.createElem(nodeName);
          }

          // Avoid adding some elements to fragments in IE < 9 because
          // * Attributes like `name` or `type` cannot be set/changed once an element
          //   is inserted into a document/fragment
          // * Link elements with `src` attributes that are inaccessible, as with
          //   a 403 response, will cause the tab/window to crash
          // * Script elements appended to fragments will execute when their `src`
          //   or `text` property is set
          return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
        }

        /**
         * returns a shived DocumentFragment for the given document
         * @memberOf html5
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived DocumentFragment.
         */
        function createDocumentFragment(ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createDocumentFragment();
          }
          data = data || getExpandoData(ownerDocument);
          var clone = data.frag.cloneNode(),
          i = 0,
          elems = getElements(),
          l = elems.length;
          for(;i<l;i++){
            clone.createElement(elems[i]);
          }
          return clone;
        }

        /**
         * Shivs the `createElement` and `createDocumentFragment` methods of the document.
         * @private
         * @param {Document|DocumentFragment} ownerDocument The document.
         * @param {Object} data of the document.
         */
        function shivMethods(ownerDocument, data) {
          if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
          }


          ownerDocument.createElement = function(nodeName) {
            //abort shiv
            if (!html5.shivMethods) {
              return data.createElem(nodeName);
            }
            return createElement(nodeName, ownerDocument, data);
          };

          ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
                                                          'var n=f.cloneNode(),c=n.createElement;' +
                                                          'h.shivMethods&&(' +
                                                          // unroll the `createElement` calls
                                                          getElements().join().replace(/[\w\-]+/g, function(nodeName) {
            data.createElem(nodeName);
            data.frag.createElement(nodeName);
            return 'c("' + nodeName + '")';
          }) +
            ');return n}'
                                                         )(html5, data.frag);
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Shivs the given document.
         * @memberOf html5
         * @param {Document} ownerDocument The document to shiv.
         * @returns {Document} The shived document.
         */
        function shivDocument(ownerDocument) {
          if (!ownerDocument) {
            ownerDocument = document;
          }
          var data = getExpandoData(ownerDocument);

          if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
            data.hasCSS = !!addStyleSheet(ownerDocument,
                                          // corrects block display not defined in IE6/7/8/9
                                          'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' +
                                            // adds styling not present in IE6/7/8/9
                                            'mark{background:#FF0;color:#000}' +
                                            // hides non-rendered elements
                                            'template{display:none}'
                                         );
          }
          if (!supportsUnknownElements) {
            shivMethods(ownerDocument, data);
          }
          return ownerDocument;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * The `html5` object is exposed so that more elements can be shived and
         * existing shiving can be detected on iframes.
         * @type Object
         * @example
         *
         * // options can be changed before the script is included
         * html5 = { 'elements': 'mark section', 'shivCSS': false, 'shivMethods': false };
         */
        var html5 = {

          /**
           * An array or space separated string of node names of the elements to shiv.
           * @memberOf html5
           * @type Array|String
           */
          'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video',

          /**
           * current version of html5shiv
           */
          'version': version,

          /**
           * A flag to indicate that the HTML5 style sheet should be inserted.
           * @memberOf html5
           * @type Boolean
           */
          'shivCSS': (options.shivCSS !== false),

          /**
           * Is equal to true if a browser supports creating unknown/HTML5 elements
           * @memberOf html5
           * @type boolean
           */
          'supportsUnknownElements': supportsUnknownElements,

          /**
           * A flag to indicate that the document's `createElement` and `createDocumentFragment`
           * methods should be overwritten.
           * @memberOf html5
           * @type Boolean
           */
          'shivMethods': (options.shivMethods !== false),

          /**
           * A string to describe the type of `html5` object ("default" or "default print").
           * @memberOf html5
           * @type String
           */
          'type': 'default',

          // shivs the document according to the specified `html5` object options
          'shivDocument': shivDocument,

          //creates a shived element
          createElement: createElement,

          //creates a shived documentFragment
          createDocumentFragment: createDocumentFragment
        };

        /*--------------------------------------------------------------------------*/

        // expose html5
        window.html5 = html5;

        // shiv the document
        shivDocument(document);

    }(this, document));
    /*>>shiv*/

    // Assign private properties to the return object with prefix
    Modernizr._version      = version;

    // expose these for the plugin API. Look in the source for how to join() them against your input
    /*>>prefixes*/
    Modernizr._prefixes     = prefixes;
    /*>>prefixes*/
    /*>>domprefixes*/
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;
    /*>>domprefixes*/

    /*>>mq*/
    // Modernizr.mq tests a given media query, live against the current state of the window
    // A few important notes:
    //   * If a browser does not support media queries at all (eg. oldIE) the mq() will always return false
    //   * A max-width or orientation query will be evaluated against the current state, which may change later.
    //   * You must specify values. Eg. If you are testing support for the min-width media query use:
    //       Modernizr.mq('(min-width:0)')
    // usage:
    // Modernizr.mq('only screen and (max-width:768)')
    Modernizr.mq            = testMediaQuery;
    /*>>mq*/

    /*>>hasevent*/
    // Modernizr.hasEvent() detects support for a given event, with an optional element to test on
    // Modernizr.hasEvent('gesturestart', elem)
    Modernizr.hasEvent      = isEventSupported;
    /*>>hasevent*/

    /*>>testprop*/
    // Modernizr.testProp() investigates whether a given style property is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testProp('pointerEvents')
    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };
    /*>>testprop*/

    /*>>testallprops*/
    // Modernizr.testAllProps() investigates whether a given style property,
    //   or any of its vendor-prefixed variants, is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testAllProps('boxSizing')
    Modernizr.testAllProps  = testPropsAll;
    /*>>testallprops*/


    /*>>teststyles*/
    // Modernizr.testStyles() allows you to add custom styles to the document and test an element afterwards
    // Modernizr.testStyles('#modernizr { position:absolute }', function(elem, rule){ ... })
    Modernizr.testStyles    = injectElementWithStyles;
    /*>>teststyles*/


    /*>>prefixed*/
    // Modernizr.prefixed() returns the prefixed or nonprefixed property name variant of your input
    // Modernizr.prefixed('boxSizing') // 'MozBoxSizing'

    // Properties must be passed as dom-style camelcase, rather than `box-sizing` hypentated style.
    // Return values will also be the camelCase variant, if you need to translate that to hypenated style use:
    //
    //     str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

    // If you're trying to ascertain which transition end event to bind to, you might do something like...
    //
    //     var transEndEventNames = {
    //       'WebkitTransition' : 'webkitTransitionEnd',
    //       'MozTransition'    : 'transitionend',
    //       'OTransition'      : 'oTransitionEnd',
    //       'msTransition'     : 'MSTransitionEnd',
    //       'transition'       : 'transitionend'
    //     },
    //     transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];

    Modernizr.prefixed      = function(prop, obj, elem){
      if(!obj) {
        return testPropsAll(prop, 'pfx');
      } else {
        // Testing DOM property e.g. Modernizr.prefixed('requestAnimationFrame', window) // 'mozRequestAnimationFrame'
        return testPropsAll(prop, obj, elem);
      }
    };
    /*>>prefixed*/


    /*>>cssclasses*/
    // Remove "no-js" class from <html> element, if it exists:
    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                            // Add the new classes to the <html> element.
                            (enableClasses ? ' js ' + classes.join(' ') : '');
    /*>>cssclasses*/

    return Modernizr;

})(this, this.document);

(function() {

	var _isMSIE = (/msie/i).test(navigator.userAgent);

	function include(mixin) {
		var key;

		// include class level methods
		if (mixin.self) {
			for (key in mixin.self) {
				if (mixin.self.hasOwnProperty(key) && !this[key]) {
					this[key] = mixin.self[key];
				}
			}
		}

		// include instance level methods
		if (mixin.prototype) {
			for (key in mixin.prototype) {
				if (mixin.prototype.hasOwnProperty(key) && !this.prototype[key]) {
					this.prototype[key] = mixin.prototype[key];
				}
			}
		}

		// include other mixins
		if (mixin.includes) {
			mixin.includes = (mixin.includes instanceof Array) ? mixin.includes : [mixin.includes];

			for (var i = 0, length = mixin.includes.length; i < length; i++) {
				this.include(mixin.includes[i]);
			}
		}

		if (mixin.included) {
			mixin.included(this);
		}

		mixin = null;
	}

	function extend(descriptor) {
		descriptor = descriptor || {};
		var key, i, length;

		// Constructor function for our new class
		var Klass;

		if (_isMSIE) {
			Klass = function() {
				// MSIE does not set the __proto__ property automatically, so we must do it at runtime
				//if (!this.hasOwnProperty("__proto__")) {
					this.__proto__ = Klass.prototype;
				//}

				if (!Klass.__inheriting) {
					this.initialize.apply(this, arguments);
				}
			};
		}
		else {
			// All other browsers play nice.
			Klass = function() {
				if (!Klass.__inheriting) {
					this.initialize.apply(this, arguments);
				}
			};
		}

		// Flag to prevent calling Klass#initialize when setting up the inheritance chain.
		Klass.__inheriting = false;

		// "inherit" class level methods
		for (key in this) {
			if (this.hasOwnProperty(key)) {
				Klass[key] = this[key];
			}
		}

		// new class level methods
		if (descriptor.self) {
			for (key in descriptor.self) {
				if (descriptor.self.hasOwnProperty(key)) {
					Klass[key] = descriptor.self[key];
				}
			}
		}

		// Set up true prototypal inheritance for ECMAScript compatible browsers
		try {
			this.__inheriting = true;     // Set the flag indicating we are inheriting from the parent class
			Klass.prototype = new this(); // The "new" operator generates a new prototype object, setting the __proto__ property all browsers except MSIE
			this.__inheriting = false;    // Unset the inheriting flag
		}
		catch (error) {
			this.__inheriting = false;    // Oops! Something catestrophic went wrong during inheriting. Unset the inheritance flag
			throw error;                  // Throw the error. Let the developer fix this.
		}

		// new instance level methods
		if (_isMSIE) {
			// MSIE does not set the __proto__ property so we forefully set it here.
			Klass.prototype.__proto__ = this.prototype;
		}

		// new instance level methods
		if (descriptor.prototype) {
			for (key in descriptor.prototype) {
				if (descriptor.prototype.hasOwnProperty(key)) {
					Klass.prototype[key] = descriptor.prototype[key];
				}
			}
		}

		// apply mixins
		if (descriptor.includes) {
			// force includes to be an array
			descriptor.includes = (descriptor.includes instanceof Array) ? descriptor.includes : [descriptor.includes];

			for (i = 0, length = descriptor.includes.length; i < length; i++) {
				Klass.include(descriptor.includes[i]);
			}
		}

		// ensure new prototype has an initialize method
		Klass.prototype.initialize = Klass.prototype.initialize || function() {};

		// set reference to constructor function in new prototype
		Klass.prototype.constructor = Klass;

		descriptor = null;

		return Klass;
	}

	// Make "include" available to the World
	if (!Function.prototype.include) {
		Function.prototype.include = include;
	}

	// Make "extend" available to the World
	if (!Function.prototype.extend) {
		if (Object.extend) {
			// Some JavaScript libraries already have an "extend" function
			Object._extend = extend;
		}

		Function.prototype.extend = extend;
	}

})();


var Cerealizer = {

	_instances: {},

	objectFactory: null,

	_types: {},

	getInstance: function getInstance(name) {
		if (this._types[name]) {
			if (!this._instances[name]) {
				var instance;

				if (this.objectFactory) {
					instance = this.objectFactory.getInstance(name);

					if (!instance) {
						throw new Error("Could not get serializer instance from object factory for type: " + name);
					}
				}
				else {
					instance = new this._types[name]();
				}

				this._instances[name] = instance;
			}

			return this._instances[name];
		}
		else {
			throw new Error("Cannot get instance for unregistered type: " + name);
		}
	},

	registerType: function registerType(klass, names) {
		for (var i = 0, length = names.length; i < length; i++) {
			this._types[ names[i] ] = klass;
		}
	}

};

Cerealizer.Json = function Json() {};

Cerealizer.Json.prototype = {

	constructor: Cerealizer.Json,

	regex: /^[{\[]].*[}\]]$/g,

	deserialize: function deserialize(str) {
		return JSON.parse(str);
	},

	serialize: function serialize(data) {
		return JSON.stringify(data);
	},

	test: function test(str) {
		return this.regex.test(str);
	},

	toString: function toString() {
		return "[object Cerealizer.Json]";
	}

};

if (!window.JSON) {
	throw new Error("No native JSON parser was found. Consider using JSON2.js (https://github.com/douglascrockford/JSON-js)");
}

Cerealizer.registerType(Cerealizer.Json, [
	"json",
	"text/json",
	"application/json"
]);

Cerealizer.QueryString = function QueryString() {};

Cerealizer.QueryString.prototype = {

	constructor: Cerealizer.QueryString,

	hashNotation: true,

	keysRegex: /[\[\].]+/,

	pairsRegex: /([^=&]+)=([^&]+)/g,

	regex: /([^=&]+)=([^&]+)/,

	_convert: function _convert(s) {
		s = typeof s === "string" ? unescape(s) : s;

		if (/^[-+0-9.]+$/.test(s) && !isNaN(s)) {
			return Number(s);
		}
		else if (/^(true|false)$/.test(s)) {
			return s === "true";
		}
		else if (s === "NaN") {
			return NaN;
		}
		else {
			return s;
		}
	},

	_convertAndHydrate: function _convertAndHydrate(data, key, value) {
		value = this._convert(unescape(value));

		if (this._isValid(value)) {
			keys = key
				.replace(/]$/, "")
				.split(this.keysRegex);

			this._hydrate(data, keys, value);
		}
	},

	deserialize: function deserialize(str) {
		var that = this;
		var data = {};
		var keys, values;

		str.replace(/^\?/, "").replace(this.pairsRegex, function(match, key, value) {
			if (/\[\]/.test(key)) {
				throw new Error("Cannot deserialize keys with empty array notation: " + key);
			}

			that._convertAndHydrate(data, key, value);
		});

		return data;
	},

	_hydrate: function _hydrate(data, keys, value) {
		var currData = data,
		    key, i = 0,
		    length = keys.length - 1,
		    lastKey = unescape( keys[ keys.length - 1 ] );

		// Find the object we want to set the value on
		for (i; i < length; i++) {
			key = unescape(keys[i]);

			if (!currData.hasOwnProperty(key)) {
				currData[key] = {};
			}

			currData = currData[key];
		}

		currData[lastKey] = value;
		currData = keys = null;

		return data;
	},

	_isValid: function _isValid(value) {
		if (value === null || value === undefined) {
			return false;
		}
		else {
			var t = typeof(value);

			if (t === "number") {
				return !isNaN(value);
			}
			else {
				return (t === "string" || t === "boolean") ? true : false;
			}
		}
	},

	_isObject: function _isObject(x) {
		return Object.prototype.toString.call(x) === "[object Object]";
	},

	serialize: function serialize(data) {
		var keyDelimeterLeft = this.hashNotation ? "[" : ".",
		    keyDelimeterRight = this.hashNotation ? "]" : "",
		    arrayKeyDelimeterLeft = "[",
		    arrayKeyDelimeterRight = "]",
		    params = [];

		return this._serialize(data, params, "", keyDelimeterLeft, keyDelimeterRight, arrayKeyDelimeterLeft, arrayKeyDelimeterRight).join("&");
	},

	_serialize: function _serialize(data, params, keyPrefix, keyDelimeterLeft, keyDelimeterRight, arrayKeyDelimeterLeft, arrayKeyDelimeterRight) {
		var nextKeyPrefix,
		    arrayKeyRegex = /^[0-9+]$/,
		    name, value;

		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				if (this._isObject(data[key])) {
					if (keyPrefix) {
						if (arrayKeyRegex.test(key)) {
							nextKeyPrefix = keyPrefix + arrayKeyDelimeterLeft + key + arrayKeyDelimeterRight;
						}
						else {
							nextKeyPrefix = keyPrefix + keyDelimeterLeft + key + keyDelimeterRight;
						}
					}
					else {
						nextKeyPrefix = key;
					}

					this._serialize(data[key], params, nextKeyPrefix, keyDelimeterLeft, keyDelimeterRight, arrayKeyDelimeterLeft, arrayKeyDelimeterRight);
				}
				else if (this._isValid(data[key])) {
					if (keyPrefix) {
						if (arrayKeyRegex.test(key)) {
							name = keyPrefix + arrayKeyDelimeterLeft + escape(key) + arrayKeyDelimeterRight;
						}
						else {
							name = keyPrefix + keyDelimeterLeft + escape(key) + keyDelimeterRight;
						}
					}
					else {
						name = escape(key);
					}

					value = escape(data[key]);
					params.push(name + "=" + value);
				}
			}
		}

		return params;
	},

	test: function test(str) {
		return this.regex.test(str);
	},

	toString: function toString() {
		return "[object Cerealizer.QueryString]";
	}

};

Cerealizer.registerType(Cerealizer.QueryString, [
	"queryString",
	"application/x-www-form-urlencoded",
	"multipart/form-data"
]);

Cerealizer.Xml = function Xml() {
	this.parser = this.constructor.getParser();
};

Cerealizer.Xml.getParser = function getParser() {
	if (window.DOMParser) {
		return new DOMParser();
	}
	else {
		return null;
	}
};

Cerealizer.Xml.prototype = {

	constructor: Cerealizer.Xml,

	parser: null,

	regex: /^\s*<[a-zA-Z][a-zA-Z0-9:]*.*?<\/[a-zA-Z0-9:]+[a-zA-Z]>\s*$/,

	_deserializeMSIE: function _deserializeMSIE(str) {
		var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = false;
		xmlDoc.loadXML(str);

		return xmlDoc;
	},

	_deserializeStandard: function _deserializeStandard(str) {
		return this.parser.parseFromString(str, "text/xml");
	},

	_escape: function _escape(x) {
		return String(x)
			.replace(/\&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	},

	_isObject: function _isObject(x) {
		return Object.prototype.toString.call(x) === "[object Object]";
	},

	serialize: function serialize(data) {
		var tags = this._serialize(data, []);
		return tags.join("");
	},

	_serialize: function _serialize(data, tags) {
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				if (this._isObject(data[key])) {
					tags.push("<" + key + ">");
					this._serialize(data[key], tags);
					tags.push("</" + key + ">");
				}
				else {
					tags.push("<" + key + ">" + this._escape(data[key]) + "</" + key + ">");
				}
			}
		}

		return tags;
	},

	test: function test(str) {
		return this.regex.test(str);
	},

	toString: function toString() {
		return "[object Cerealizer.Xml]";
	}

};

if (window.DOMParser) {
	Cerealizer.Xml.prototype.deserialize = Cerealizer.Xml.prototype._deserializeStandard;
}
else if (window.ActiveXObject) {
	Cerealizer.Xml.prototype.deserialize = Cerealizer.Xml.prototype._deserializeMSIE;
}
else {
	throw new Error("No native XML parser could be found.");
}

Cerealizer.registerType(Cerealizer.Xml, [
	"xml",
	"text/xml",
	"application/xml"
]);

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
			if (!this.prototype.callbacks[name]) {
				this.prototype.callbacks[name] = [];
			}
			else if (!this.prototype.callbacks[name] instanceof Array) {
				this.prototype.callbacks[name] = [this.prototype.callbacks[name]];
			}

			this.prototype.callbacks[name].push(method);
		}
	},

	prototype: {
		callbacks: {},

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

dom = window.dom || {};
dom.events = dom.events || {};

dom.events.Delegator = function() {

// Access: Public

	this.initialize = function(delegate, node, actionPrefix) {
		this.actionPrefix = null;
		this.eventTypes = [];
		this.eventTypesAdded = {};
		this.eventActionMapping = null;
		this.actionEventMapping = null;
		this.delegate = delegate || null;
		this.node = node || null;

		if (actionPrefix) {
			this.setActionPrefix(actionPrefix);
		}
	};

	this.destructor = function() {
		if (this.node) {
			this.removeEventTypes(this.eventTypes);
			this.node = null;
		}

		this.delegate = self = null;
	};

	this.init = function() {
		if (typeof this.node === "string") {
			this.node = document.getElementById(this.node);
		}

		return this;
	};

	if (!this.addEventListener) {
		this.addEventListener = function(element, eventType, callback) {
			if (element.addEventListener) {
				element.addEventListener(eventType, callback, false);
			}
			else {
				element.attachEvent("on" + eventType, callback);
			}
		};
	}

	this.addEventType = function(eventType) {
		if (this.eventTypesAdded[eventType]) {
			return;
		}

		if (eventType === "enterpress") {
			this.addEventListener(this.node, "keypress", handleEnterpressEvent);
		}
		else {
			this.addEventListener(this.node, eventType, handleEvent);
		}

		this.eventTypes.push(eventType);
		this.eventTypesAdded[eventType] = true;
	};

	this.addEventTypes = function(eventTypes) {
		var i = 0, length = eventTypes.length;

		for (i; i < length; ++i) {
			this.addEventType(eventTypes[i]);
		}
	};

	if (!this.removeEventListener) {
		this.removeEventListener = function(element, eventType, callback) {
			if (element.removeEventListener) {
				element.removeEventListener(eventType, callback, false);
			}
			else {
				element.detachEvent("on" + eventType, callback);
			}
		};
	}

	this.removeEventType = function(eventType) {
		if (this.eventTypesAdded[eventType]) {
			if (eventType === "enterpress") {
				this.removeEventListener(this.node, "keypress", handleEnterpressEvent);
			}
			else {
				this.removeEventListener(this.node, eventType, handleEvent);
			}

			this.eventTypesAdded[eventType] = false;
		}
	};

	this.removeEventTypes = function(eventTypes) {
		var i = 0, length = eventTypes.length;

		for (i; i < length; ++i) {
			this.removeEventType(eventTypes[i]);
		}
	};

	this.setActionPrefix = function(actionPrefix) {
		if (!actionPrefix.match(/\.$/)) {
			actionPrefix += ".";
		}

		this.actionPrefix = actionPrefix;
	};

	this.setEventActionMapping = function(mapping) {
		var eventType, i, length;

		if (this.eventActionMapping) {
			for (eventType in this.eventActionMapping) {
				if (this.eventActionMapping.hasOwnProperty(eventType)) {
					this.removeEventType(eventType);
				}
			}
		}

		this.actionEventMapping = {};

		for (eventType in mapping) {
			if (mapping.hasOwnProperty(eventType)) {
				this.addEventType(eventType);
				mapping[eventType] = (mapping[eventType] instanceof Array) ? mapping[eventType] : [ mapping[eventType] ];

				for (i = 0, length = mapping[eventType].length; i < length; i++) {
					this.actionEventMapping[ mapping[eventType][i] ] = eventType;
				}
			}
		}

		this.eventActionMapping = mapping;

		mapping = null;
	};

	if (!this.triggerEvent) {
		this.triggerEvent = function(type) {
			var event = getDocument().createEvent("CustomEvent");
			event.initCustomEvent(type, true, false, null);
			this.node.dispatchEvent(event);
			event = null;
		};
	}

// Access: Private

	var self = this;

	this.node = null;

	this.eventTypes = null;

	this.eventTypesAdded = null;

	this.delegate = null;

	function getActionParams(element, eventType) {
		var paramsAttr = element.getAttribute("data-actionparams-" + eventType) ||
		                 element.getAttribute("data-actionparams");

		element = null;

		return (paramsAttr) ? JSON.parse(paramsAttr) : {};
	}

	function getDocument() {
		return self.node.ownerDocument;
	}

	function getAction(rawAction) {
		return self.actionPrefix ? rawAction.replace(/.+?(\w+)$/g, "$1") : rawAction;
	}

	function getMethodFromAction(rawAction, action) {
		var method = action;

		if (self.actionPrefix) {
			method = action;

			if (self.actionPrefix + method !== rawAction) {
				method = null;
			}
			else if (!self.delegate[method] && self.delegate.handleAction) {
				method = "handleAction";
			}
		}
		else if (!self.delegate[method] && self.delegate.handleAction) {
			method = "handleAction";
		}

		return method;
	};

	function stopPropagationPatch() {
		this._stopPropagation();
		this.propagationStopped = true;
	}

	function patchEvent(event) {
		if (!event._stopPropagation) {
			event._stopPropagation = event.stopPropagation;
			event.stopPropagation = stopPropagationPatch;
			event.propagationStopped = false;
			event.stop = function() {
				this.preventDefault();
				this.stopPropagation();
			};

			if (!event.actionTarget) {
				// This event has not been delegated yet. Start the delegation at the target
				// element for the event. Note that event.target !== self.node. The
				// event.target object is the element that got clicked, for instance.
				event.actionTarget = event.target || event.srcElement;
			}
		}

		return event;
	}

	function handleEvent(event) {
		event = patchEvent(event || window.event);
		handlePatchedEvent(event, event.actionTarget);
		event = null;
	}

	function handleEnterpressEvent(event) {
		if (event.keyCode === 13) {
			handleEvent(event);
		}

		event = null;
	}

	function handlePatchedEvent(event, element) {
		// The default method to call on the delegate is "handleAction". This will only
		// get called if the delegate has defined a "handleAction" method.
		var rawAction = null, action = null, method = null, params;

		rawAction = element.getAttribute("data-action-" + event.type) || element.getAttribute("data-action");

		if (rawAction) {
			action = getAction(rawAction);

			if (self.actionEventMapping && self.actionEventMapping[ action ] !== event.type) {
				// An action-to-event mapping was found, but not for this action + event combo. Do nothing.
				// For instance, the action is "foo", and the event is "click", but eventActionMapping.foo
				// is either undefined or maps to a different event type.
				action = null;
			}
			else {
				method = getMethodFromAction(rawAction, action);
			}
		}

		if (method && self.delegate[method]) {
			// The method exists on the delegate object. Try calling it...
			try {
				params = getActionParams(element, event.type);
				self.delegate[method](event, element, params, action);
			}
			catch (error) {
				event.preventDefault();
				event.stopPropagation();
				handleActionError(event, element, params, action, method, error);
			}
		}

		if (!event.propagationStopped && element !== self.node && element.parentNode) {
			// The delegate has not explicitly stopped the event, so keep looking for more data-action
			// attributes on the next element up in the document tree.
			event.actionTarget = element.parentNode;
			handlePatchedEvent(event, event.actionTarget);
		}
		else {
			// Finished calling actions. Return event object to its normal state. Let
			// event continue bubbling up the DOM.
			event.actionTarget = null;
			event.stopPropagation = event._stopPropagation;
			event._stopPropagation = null;
			event.propagationStopped = null;
		}

		event = element = null;
	}
 
	function handleActionError(event, element, params, action, method, error) {
		// The delegate method threw an error. Try to recover gracefully...

		if (self.delegate.handleActionError) {
			// The delegate has a generic error handler, call that, passing in the error object.
			self.delegate.handleActionError(event, element, {error: error, params: params, method: method}, action);
		}
		else if (self.constructor.errorDelegate) {
			// A master error delegate was found (for instance, and application object). Call "handleActionError"
			// so this one object can try handling errors gracefully.
			self.constructor.errorDelegate.handleActionError(event, element, {error: error, params: params, method: method}, action);
		}
		else if (self.constructor.logger) {
			// A class level logger was found, so log an error level message.
			self.constructor.logger.warn("An error was thrown while executing method \"" + method + "\", action \"" + action + "\", during a \"" + event.type + "\" event on element " + self.node.nodeName + "." + self.node.className.split(/\s+/g).join(".") + "#" + self.node.id + ".");
			self.constructor.logger.error(error);
		}
		else {
			// Give up. Throw the error and let the developer fix this.
			throw error;
		}
	}

	this.constructor = dom.events.Delegator;
	this.getActionParams = getActionParams;
	this.getMethodFromAction = getMethodFromAction;
	this.handleActionError = handleActionError;
	this.handleEvent = handleEvent;
	this.handlePatchedEvent = handlePatchedEvent;
	this.initialize.apply(this, arguments);
};

dom.events.Delegator.logger = window.console || null;
dom.events.Delegator.errorDelegate = null;

function ElementStore() {
}
ElementStore.prototype = {

	_cache: null,

	config: null,

	_document: null,

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

var Events = {};

// @requires events.js

Events.Dispatcher = function Dispatcher() {
	this._subscribers = {};
};

Events.Dispatcher.logger = window.console || null;

Events.Dispatcher.prototype = {

	_subscribers: null,

	constructor: Events.Dispatcher,

	destructor: function destructor() {
		if (!this._subscribers) {
			return;
		}

		var _subscribers = this._subscribers, subscriber, eventType, i, length;

		for (eventType in _subscribers) {
			if (_subscribers.hasOwnProperty(eventType)) {
				for (i = 0, length = _subscribers[eventType].length; i < length; i++) {
					subscriber = _subscribers[eventType][i];
					subscriber.callback = subscriber.context = null;
				}

				_subscribers[eventType] = null;
			}
		}

		subscriber = _subscribers = this._subscribers = null;
	},

	_dispatchEvent: function _dispatchEvent(event, _subscribers) {
		var subscriber;

		for (var i = 0, length = _subscribers.length; i < length; i++) {
			subscriber = _subscribers[i];

			if (subscriber.type === "function") {
				subscriber.callback.call(subscriber.context, event, event.publisher, event.data);
			}
			else if (subscriber.type === "string") {
				subscriber.context[ subscriber.callback ]( event, event.publisher, event.data );
			}

			if (event.cancelled) {
				break;
			}
		}

		_subscribers = subscriber = event = null;
	},

	publish: function publish(eventType, publisher, data) {
		if (!this._subscribers[eventType]) {
			return true;
		}

		var event = new Events.Event(eventType, publisher, data);
		var _subscribers = this._subscribers[eventType];
		var cancelled = false;

		this._dispatchEvent(event, _subscribers);
		cancelled = event.cancelled;
		event.destructor();

		event = publisher = data = _subscribers = null;

		return !cancelled;
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
			var contextType = typeof context;
			var callbackType = typeof callback;
			var _subscribers = this._subscribers[eventType];
			var i = _subscribers.length;
			var subscriber;

			if (contextType === "function") {
				callback = context;
				context = null;
				callbackType = "function";
			}
			else if (contextType === "object" && callbackType === "undefined") {
				callbackType = "any";
			}

			while (i--) {
				subscriber = _subscribers[i];

				if (
				    (callbackType === "any" && subscriber.context === context) ||
						(subscriber.type === callbackType && subscriber.context === context && subscriber.callback === callback)
				) {
					_subscribers.splice(i, 1);
				}
			}
		}

		context = callback = _subscribers = subscriber = null;
	},

	unsubscribeAll: function unsubscribeAll(context) {
		var type, i, _subscribers;

		for (type in this._subscribers) {
			if (this._subscribers.hasOwnProperty(type)) {
				_subscribers = this._subscribers[type];
				i = _subscribers.length;

				while (i--) {
					if (_subscribers[i].context === context) {
						_subscribers.splice(i, 1);
					}
				}
			}
		}

		context = _subscribers = null;
	}
};

// @requires events.js
// @requires events/dispatcher.js
// @requires events/event.js

Events.ApplicationEvents = {

	eventDispatcher: null,

	self: {

		getEventDispatcher: function getEventDispatcher() {
			if (!Events.ApplicationEvents.eventDispatcher) {
				Events.ApplicationEvents.eventDispatcher = new Events.Dispatcher();
			}

			return Events.ApplicationEvents.eventDispatcher;
		},

		checkEventDispatcher: function checkEventDispatcher() {
			if (!this.getEventDispatcher()) {
				throw new Error("No application event dispatcher was found. Please set Events.ApplicationEvents.eventDispatcher.");
			}

			return true;
		},

		publish: function publish(eventName, publisher, data) {
			this.checkEventDispatcher();
			return this.getEventDispatcher().publish(eventName, publisher, data);
		},

		subscribe: function subscribe(eventName, context, callback) {
			this.checkEventDispatcher();
			this.getEventDispatcher().subscribe(eventName, context, callback);
		},

		unsubscribe: function unsubscribe(eventName, context, callback) {
			this.checkEventDispatcher();
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

// @requires events.js
// @requires events/dispatcher.js
// @requires events/event.js
// @requires events/application_events.js

Events.Notifications = {

	includes: Events.ApplicationEvents,

	guid: 0,

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

			this._notificationId = Events.Notifications.guid++;

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

/**
 * class Hash < Object
 *
 * This class represents a managed key-value pair store.
 **/
function Hash(data) {
	if (data) {
		this.merge(data);
	}
}
Hash.prototype = {

	constructor: Hash,

	destructor: function destructor() {
		for (var key in this) {
			if (this.exists(key)) {
				this[key] = null;
			}
		}
	},

	empty: function empty() {
		var keys = this.keys(), i = 0, length = keys.length, key;

		for (i; i < length; i++) {
			key = keys[i];
			this[key] = null;
			delete this[key];
		}

		return this;
	},

	exists: function exists(key) {
		return (!this.isReserved(key) && this.hasOwnProperty(key)) ? true : false;
	},

	filter: function filter(callback, context) {
		context = context || this;
		var filteredHash = new Hash();

		for (var key in this) {
			if (this.exists(key) && callback.call(context, key, this[key])) {
				filteredHash.set(key, this[key]);
			}
		}

		return filteredHash;
	},

	forEach: function forEach(callback, context) {
		context = context || this;

		for (var key in this) {
			if (this.exists(key)) {
				if (callback.call(context, key, this[key]) === false) {
					break;
				}
			}
		}

		callback = context = null;

		return this;
	},

	get: function get(key) {
		if (this.isReserved(key)) {
			throw new Error("Cannot get reserved property: " + key);
		}
		else {
			return this.hasOwnProperty(key) ? this[key] : null;
		}
	},

	isEmpty: function isEmpty() {
		return this.size() === 0;
	},

	isReserved: function isReserved(key) {
		return this.constructor.prototype.hasOwnProperty(key);
	},

	keys: function keys() {
		var keys = [];

		for (var key in this) {
			if (this.exists(key)) {
				keys.push(key);
			}
		}

		return keys;
	},

	merge: function merge(overrides, safe) {
		if (!overrides) {
			throw new Error("Missing required argument: overrides");
		}

		var key, newValue, oldValue, i, length;

		for (key in overrides) {
			if (overrides.hasOwnProperty(key)) {
				oldValue = this[key];
				newValue = overrides[key];

				if (!newValue) {
					if (!this.exists(key) || !safe) {
						this.set(key, newValue);
					}
				}
				else if (newValue.constructor === Array && oldValue && oldValue.constructor === Array && !this.isReserved(key)) {
					for (i = 0, length = newValue.length; i < length; i++) {
						oldValue.push(newValue[i]);
					}
				}
				else if (oldValue && oldValue.constructor === Hash && !this.isReserved(key)) {
					oldValue.merge(newValue);
				}
				else if (!this.exists(key) || !safe) {
					this.set(key, overrides[key]);
				}
			}
		}

		return this;
	},

	safeMerge: function safeMerge(overrides) {
		this.merge(overrides, true);
	},

	set: function set(key, value) {
		if (this.isReserved(key)) {
			throw new Error("Cannot set reserved property: " + key);
		}

		this[key] = value;

		return this;
	},

	size: function size() {
		return this.keys().length;
	},

	toString: function toString() {
		return "[object Hash]";
	}

};

function Reaper() {
}

Reaper.prototype = {

	allowNulls: false,

	flat: true,

	nestedKeysRegex: /[.\[\]]+/g,

	constructor: Reaper,

	_extractFieldValues: function _extractFieldValues(fields, data) {
		var value, name, i = 0, length = fields.length;

		for (i; i < length; i++) {
			value = this._extractValue(fields[i]);
			name = fields[i].name;
			this._setValue(data, name, value);
		}
	},

	_extractValue: function _extractValue(field) {
		var nodeName = field.nodeName.toLowerCase(),
		    value = null, i, length;

		if (!field.disabled) {
			if (nodeName === "input") {
				if (field.type === "checkbox" || field.type === "radio") {
					if (field.checked) {
						value = field.value;
					}
				}
				else {
					value = field.value;
				}
			}
			else if (nodeName === "select") {
				if (field.multiple) {
					value = [];

					for (i = 0, length = field.options.length; i < length; ++i) {
						if (!field.options[i].disabled && field.options[i].selected && field.options[i].value) {
							value.push(field.options[i].value);
						}
					}
				}
				else {
					value = field.value;
				}
			}
			else {
				value = field.value;
			}
		}

		field = null;

		return (value === "") ? null : value;
	},

	getData: function getData(element, data) {
		if (!element) {
			throw new Error("Missing required argument: element");
		}

		data = data || {};

		var inputs = element.getElementsByTagName("input"),
		    selects = element.getElementsByTagName("select"),
		    textareas = element.getElementsByTagName("textarea");

		this._extractFieldValues(inputs, data);
		this._extractFieldValues(selects, data);
		this._extractFieldValues(textareas, data);

		element = inputs = selects = textareas = null;

		return data;
	},

	_setNestedValue: function _setNestedValue(data, keys, value) {
		var currData = data,
		    key, i = 0,
		    length = keys.length - 1,
		    lastKey = keys[ length ];

		// Find the object we want to set the value on
		for (i; i < length; i++) {
			key = keys[i];

			if (!currData.hasOwnProperty(key)) {
				currData[key] = {};
			}

			currData = currData[key];
		}

		currData[lastKey] = value;

		currData = keys = null;
	},

	_setValue: function _setValue(data, name, value) {
		if (this.flat) {
			if (value !== null || this.allowNulls) {
				data[name] = value;
			}
		}
		else if (value !== null || this.allowNulls) {
			var keys = name
				.replace(/\]$/, "")
				.split(this.nestedKeysRegex);

			this._setNestedValue(data, keys, value);
		}
	}

};

// @import Injerit.js
// @import ElementStore
// @import ElementStore.Utils
// @import callbacks
// @import hash
// @import dom_event_delegator
// @import events

(function(g) {

var _guid = 0;

var Module = Object.extend({

	includes: [
		Callbacks.Utils,
		Events.Notifications,
		ElementStore.Utils
	],

	self: {
		manager: null,

		getManager: function getManager() {
			return Module.manager;
		},

		unregister: function unregister(module) {
			if (Module.manager) {
				Module.manager.unregisterModule(module);
			}
		}
	},

	prototype: {

		actions: {
			click: [
				"cancel"
			]
		},

		callbacks: {
			afterReady: [
				"_loaded"
			]
		},

		delegator: null,

		document: null,

		element: null,

		elementStore: {},

		guid: null,

		options: {
			actionPrefix: null,
			defaultModule: false,
		},

		window: null,

		initialize: function initialize() {
			this.guid = _guid++;
		},

		init: function init(elementOrId, options) {
			this.element = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;

			if (!this.element) {
				throw new Error("Could not find element: " + elementOrId);
			}

			this.document = this.element.ownerDocument;
			this.window = this.document.defaultView || this.document.parentWindow;

			if (!this.hasOwnProperty("options")) {
				this.options = new Hash();
			}

			this._initOptions(this.options);

			if (options) {
				this.options.merge(options);
			}

			if (!this.delegator) {
				this.delegator = new dom.events.Delegator();
			}

			this.delegator.delegate = this;
			this.delegator.node = this.element;

			if (this.options.actionPrefix) {
				this.delegator.setActionPrefix(this.options.actionPrefix);
			}

			this.delegator.init();

			this._initActions();
			this._initCallbacks();
			this._initNotifications();
			this.initElementStore(this.element);
			this.callbacks.execute("beforeReady");
			this._ready();
			this.callbacks.execute("afterReady");

			if (this.options.defaultModule) {
				this.constructor.getManager().setDefaultModule(this);
			}

			return this;
		},

		destructor: function destructor(keepElement) {
			this.callbacks.execute("beforeDestroy");

			this.constructor.unregister(this);
			this.destroyElementStore();
			this.destroyCallbacks();

			if (this.delegator) {
				this.delegator.destructor();
			}

			if (!keepElement && this.element) {
				this.element.parentNode.removeChild(this.element);
			}

			if (this.options) {
				this.options.destructor();
			}

			this.actions = this.element = this.delegator = this.options = this.document = this.window = null;
		},

		cancel: function cancel(event, element, params) {
			event.stop();
			this.destructor();
			event = element = params = null;
		},

		focus: function focus(anything) {
			var els = this.element.getElementsByTagName("*");
			var i = 0, length = els.length, el;

			if (anything) {
				for (i; i < length; i++) {
					el = els[i];

					if (el.tagName === "A" || el.tagName === "BUTTON" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type !== "hidden")) {
						if (el.focus) {
							el.focus();
						}

						if (el.select) {
							el.select();
						}

						break;
					}
				}
			}
			else {
				for (i; i < length; i++) {
					el = els[i];

					if (el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type !== "hidden")) {
						if (el.focus) {
							el.focus();
						}

						if (el.select) {
							el.select();
						}

						break;
					}
				}
			}
		},

		_ready: function _ready() {

		},

		_initActions: function _initActions() {
			// TODO: Actions appear to be merging incorrectly here and making delegator double up on events
			var actions = new Hash(), proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("actions")) {
					actions.safeMerge(proto.actions);
				}

				proto = proto.__proto__;
			}

			this.delegator.setEventActionMapping(actions);
		},

		_initCallbacks: function _initCallbacks() {
			var types = new Hash(), proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("callbacks")) {
					types.safeMerge(proto.callbacks);
				}

				proto = proto.__proto__;
			}

			this.initCallbacks(types);
		},

		_initOptions: function _initOptions() {
			var proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("options")) {
					this.options.safeMerge(proto.options);
				}

				proto = proto.__proto__;
			}
		},

		_loading: function _loading(element) {
			element = element || this.element;
			element.className += " loading";
			element = null;
		},

		_loaded: function _loaded(element) {
			element = element || this.element;
			element.className = element.className.replace(/(^|\s+)(loading)(\s+|$)/, "$1$3").replace(/[\s]{2,}/g, " ");
			element = null;
		},

		setOptions: function setOptions(overrides) {
			if (!this.hasOwnProperty("options")) {
				this.options = new Hash(overrides);
			}
			else {
				this.options.merge(overrides);
			}
		}

	}

});

// Make globally available
g.Module = Module;

})(window);
Module.FormModule = Module.extend({

	prototype: {

		actions: {
			enterpress: [
				"submit"
			],
			submit: [
				"submit"
			]
		},

		callbacks: {
			beforeReady: [
				"initExtractor",
				"initSerializerFactory"
			]
		},

		extractor: null,

		options: {
			"extractor.allowNulls": false,
			"extractor.flat": false
		},

		serializerFactory: null,

		initExtractor: function initExtractor() {
			this.extractor = this.extractor || new Reaper();
			this.extractor.allowNulls = this.options["extractor.allowNulls"];
			this.extractor.flat = this.options["extractor.flat"];
		},

		initSerializerFactory: function initSerializerFactory() {
			this.serializerFactory = this.serializerFactory || Cerealizer;
		},

		_afterSubmit: function _afterSubmit(xhr) {
			xhr = null;
		},

		_beforeSubmit: function _beforeSubmit(data, event, element, params) {
			data = event = element = params = null;
			return true;
		},

		_getData: function _getData() {
			return this.extractor.getData(this.element);
		},

		_getTransport: function _getTransport() {
			return new XMLHttpRequest();
		},

		_sendRequest: function _sendRequest(data) {
			var xhr = this._getTransport(),
			    form = this.element.getElementsByTagName("form")[0] || this.element,
			    method      = (form.getAttribute("method") || form.getAttribute("data-form-method") || "POST").toUpperCase(),
			    url         = form.getAttribute("action")  || form.getAttribute("data-form-action"),
			    contentType = form.getAttribute("enctype") || form.getAttribute("data-form-enctype") || "queryString",
			    module = this,
			    serializer = this.serializerFactory.getInstance(contentType),
			    params = serializer.serialize(data);

			if (!url) {
				throw new Error("Missing required attribute: action or data-form-action");
			}

			var onreadystatechange = function() {
				if (this.readyState !== 4) {
					return;
				}

				if (this.status < 300 || this.status > 399) {
					module.element.innerHTML = this.responseText;
					complete();
				}
			};

			var complete = function() {
				module._loaded();
				module._afterSubmit(xhr);
				module = data = event = element = params = xhr = xhr.onreadystatechange = form = null;
			};

			if (method === "GET") {
				url += /\?/.test(url) ? params : "?" + params;
				params = null;
			}

			xhr.open(method, url, true);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

			if (contentType) {
				xhr.setRequestHeader("Content-Type", contentType);
			}

			this._loading();
			xhr.onreadystatechange = onreadystatechange;
			xhr.send(params);
		},

		submit: function submit(event, element, params) {
			event.stop();

			var data = this._getData();

			if (this._beforeSubmit(data, event, element, params)) {
				this._sendRequest(data);
			}
		}

	}

});

Module = window.Module || {};

Module.Factory = function Factory() {};

Module.Factory.prototype = {

	objectFactory: null,

	constructor: Module.Factory,

	destructor: function destructor() {
		this.objectFactory = null;
	},

	createInstance: function createInstance(element, type, options) {
		var module = this.getInstance(type);

		module.init(element, options);

		return module;
	},

	getInstance: function getInstance(type) {
		var instance = null, Klass = null;

		if (this.objectFactory) {
			instance = this.objectFactory.getInstance(type);

			if (!instance) {
				throw new Error("The object factory failed to get a new instance for type: " + type);
			}
		}
		else if (/^[a-zA-Z][a-zA-Z0-9.]+[a-zA-Z0-9]$/.test(type)) {
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

		return instance;
	}

};

// @requires module/factory.js

window.Module = window.Module || {};

Module.Manager = function Manager() {};

Module.Manager.prototype = {

	baseClassName: "module",

	defaultModule: null,

	defaultModuleFocused: false,

	factory: null,

	registry: null,

	groups: null,

	constructor: Module.Manager,

	destructor: function destructor(cascadeDestroy) {
		if (Module.manager === this) {
			Module.manager = null;
		}

		if (this.registry) {
			this._destroyRegistry(cascadeDestroy);
		}

		if (this.groups) {
			this._destroyGroups();
		}

		if (this.factory) {
			if (cascadeDestroy) {
				this.factory.destructor();
			}

			this.factory = null;
		}
	},

	_destroyGroups: function _destroyGroups() {
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

	_destroyRegistry: function _destroyRegistry(cascadeDestroy) {
		var key, entry;

		for (key in this.registry) {
			if (this.registry.hasOwnProperty(key)) {
				entry = this.registry[key];

				if (cascadeDestroy) {
					entry.module.destructor(true);
				}

				entry.module = null;
				this.registry[key] = null;
			}
		}

		this.registry = null;
	},

	init: function init() {
		this.factory = (this.hasOwnProperty("factory")) ? this.factory : new Module.Factory();
		this.registry = (this.hasOwnProperty("registry")) ? this.registry : {};
		this.groups = (this.hasOwnProperty("groups")) ? this.groups : {};

		Module.manager = this;

		return this;
	},

	eagerLoadModules: function eagerLoadModules(element) {
		var els = element.getElementsByTagName("*"), i = 0, length = els.length;

		for (i; i < length; i++) {
			if (els[i].getAttribute("data-modules")) {
				this.createModules(els[i]);
			}
		}

		els = null;

		return this;
	},

	createModule: function createModule(element, type, options, register) {
		var className = element.className + " module " + type.charAt(0).toLowerCase() + type.slice(1, type.length).replace(/([.A-Z]+)/g, function(match, $1) {
			return "-" + $1.replace(/\./g, "").toLowerCase();
		});

		element.className = className.replace(/^\s+|\s+$/g, "");

		var module = this.factory.getInstance(type);

		module.setOptions(options);

		if (register) {
			this.registerModule(type, module);
		}

		element = options = null;

		return module;
	},

	createModules: function createModules(element) {
		if (!element) {
			throw new Error("Missing required argument: element");
		}

		var metaData = this.getModuleMetaData(element);

		if (metaData.types.length === 1) {
			module = this.createModule(element, metaData.types[0], metaData.options, true);
			module.init(element, metaData.options);
		}
		else {
			for (i = 0, length = metaData.types.length; i < length; i++) {
				type = metaData.types[i];
				opts = metaData.options[type] || {};
				module = this.createModule(element, type, opts, true);
				module.init(element, opts);
			}
		}

		this.markModulesCreated(element, metaData);

		metaData = element = module = opts = options = null;
	},

	focusDefaultModule: function focusDefaultModule(anything) {
		if (this.defaultModule && !this.defaultModuleFocused) {
			this.defaultModuleFocused = true;
			this.defaultModule.focus(anything);
		}
	},

	getModuleMetaData: function getModuleMetaData(element) {
		var length;
		var types = element.getAttribute("data-modules");
		var options = element.getAttribute("data-module-options");
		var metaData = {
			element: element,
			types: null,
			options: null
		};

		if (!types) {
			throw new Error("Missing required attribute data-modules on " + element.nodeName + "." + element.className.split(/\s+/g).join(".") + "#" + element.id);
		}

		types = types.replace(/^\s+|\s+$/g, "").split(/\s+/g);
		length = types.length;
		options = (options) ? JSON.parse(options) : {};

		metaData.types = types;
		metaData.options = options;

		element = null;

		return metaData;
	},

	initModuleInContainer: function initModuleInContainer(element, container, config, template, type, module) {
		var createdAt = new Date();
		var renderData = new Hash({
			guid: module.guid,
			createdAt: createdAt,
			timestamp: createdAt.getTime()
		});

		if (config.renderData) {
			renderData.merge(config.renderData);
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

		module.init(element);
		this.registerModule(type, module);
	},

	markModulesCreated: function markModulesCreated(element, metaData) {
		element.setAttribute("data-modules-created", metaData.types.join(" "));
		element.removeAttribute("data-modules");
		element = metaData = null;
	},

	registerModule: function registerModule(type, module) {
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

		module = null;
	},

	unregisterModule: function unregisterModule(module) {
		if (!module.guid || !this.registry[module.guid]) {
			module = null;
			return;
		}

		var guid = module.guid;
		var type = this.registry[guid].type;
		var group = this.groups[type];

		this.registry[guid].module = null;
		this.registry[guid] = null;
		delete this.registry[guid];

		if (group) {
			for (var i = 0, length = group.length; i < length; i++) {
				if (group[i] === module) {
					group.splice(i, 1);
					break;
				}
			}
		}

		module = group = null;
	},

	setDefaultModule: function setDefaultModule(module) {
		if (!this.defaultModule) {
			this.defaultModule = module;
		}

		module = null;
	}

};

// @import Hash
// @requires module/manager.js

Module.Manager.LazyLoader = {

	prototype: {

		lazyLoadModules: function lazyLoadModules(element, overrides) {

			var _options = new Hash({
				scrollElement: null,
				scrollTimeout: 250
			});

			var _manager = this;
			var _scrollTimer = null;
			var _scrollElement = _options.scrollElement || null;
			var _element = element;
			var _document = _element.ownerDocument;

			function init() {
				if (_manager.stopLazyLoadingModules) {
					_manager.stopLazyLoadingModules();
				}

				if (overrides) {
					_options.merge(overrides);
				}

				addEvents();

				initModulesInsideViewport();

				if (!_scrollElement.scrollTop && !_scrollElement.scrollLeft) {
					// Not all browser agree on the _scrollElement. We are at the
					// top of the page so we don't know whether the browser is
					// scrolling the <html> or <body> tag. Defer judgement until
					// the user has scrolled.
					_scrollElement = null;
				}
			}

			function destructor() {
				if (_element) {
					removeEvents();
					_element = _document = _scrollElement = null;
				}

				if (_scrollTimer) {
					clearTimeout(_scrollTimer);
					_scrollTimer = null;
				}

				if (_options) {
					_options.destructor();
					_options = null;
				}

				_manager.stopLazyLoadingModules = _manager = null;

				return this;
			}

			function addEvents() {
				if (_element.addEventListener) {
					_element.addEventListener("mouseover", handleMouseOverEvent, true);
					_document.addEventListener("scroll", handleScrollEvent, true);
				}
				else {
					_element.attachEvent("onmouseover", handleMouseOverEvent);
					_element.onscroll = handleScrollEvent;
				}
			}

			function initModulesInsideViewport() {
				var elements = _element.getElementsByTagName("*"), i, element;
				var viewport = Viewport.create(getScrollElement());

				for (i = 0; i < elements.length; i++) {
					element = elements[i];

					if (element.getAttribute("data-module-lazyload") && viewport.isVisible(element)) {
						lazyLoadModules(element, "scrollto");
					}
				}
			}

			function getScrollElement() {
				if (_scrollElement === null) {
					if (_document.body.scrollTop || _document.body.scrollLeft) {
						_scrollElement = _document.body;
					}
					else {
						_scrollElement = _document.documentElement;
					}
				}

				return _scrollElement;
			}

			function handleMouseOverEvent(event) {
				event = event || window.event;
				event.target = event.target || event.srcElement;

				if (event.target.getAttribute("data-module-lazyload")) {
					lazyLoadModules(event.target, event.type);
				}
			}

			function handleScrollEvent(event) {
				event = event || window.event;
				event.target = event.target || event.srcElement;

				if (_scrollTimer) {
					clearTimeout(_scrollTimer);
				}

				_scrollTimer = setTimeout(handleScrollStopped, _options.scrollTimeout);
			}

			function handleScrollStopped() {
				_scrollTimer = null;
				initModulesInsideViewport();
			}

			function lazyLoadModules(element, value) {
				var attr = element.getAttribute("data-module-lazyload");

				if (attr === "any" || new RegExp(value).test(attr)) {
					element.removeAttribute("data-module-lazyload");
					_manager.createModules(element);
					element.setAttribute("data-module-lazyloaded", attr);
				}

				element = null;
			}

			function removeEvents() {
				if (_element.removeEventListener) {
					_element.removeEventListener("mouseover", handleMouseOverEvent, true);
					_document.removeEventListener("scroll", handleScrollEvent, true);
				}
				else {
					_element.detachEvent("onmouseover", handleMouseOverEvent);
					_document.detachEvent("onscroll", handleScrollEvent);
				}
			}

			// internal class for viewport logic
			function Viewport() {}
			Viewport.prototype = {
				bottom: 0,
				height: 0,
				left: 0,
				right: 0,
				top: 0,
				width: 0,

				constructor: Viewport,

				isBottomInBounds: function isBottomInBounds(position) {
					return (position.top + position.height <= this.top + this.height && position.top + position.height > this.top) ? true : false;
				},

				isLeftInBounds: function isLeftInBounds(position) {
					return (position.left >= this.left && position.left < this.left + this.width) ? true : false;
				},

				isRightInBounds: function isRightInBounds(position) {
					return (position.left + position.width <= this.left + this.width && position.left + position.width > this.left) ? true : false;
				},

				isTopInBounds: function isTopInBounds(position) {
					return (position.top >= this.top && position.top < this.top + this.height) ? true : false;
				},

				isVisible: function isVisible(element) {
					var visible = false;
					var position = this._getPosition(element);

					if ((this.isRightInBounds(position) || this.isLeftInBounds(position)) && (this.isTopInBounds(position) || this.isBottomInBounds(position))) {
						visible = true;
					}

					return visible;
				},

				_getPosition: function _getPosition(element) {
					var parent = element.offsetParent;
					var position = {
						top: element.offsetTop,
						left: element.offsetLeft,
						width: element.offsetWidth,
						height: element.offsetHeight
					};

					while(parent = parent.offsetParent) {
						position.top += parent.offsetTop;
						position.left += parent.offsetLeft;
					}

					return position;
				}
			};
			Viewport.create = function create(element) {
				var viewport = new this();

				viewport.top = element.scrollTop;
				viewport.left = element.scrollLeft;
				viewport.width = element.clientWidth;
				viewport.height = element.clientHeight;
				viewport.right = element.offsetWidth - (viewport.left + viewport.width);
				viewport.bottom = element.offsetHeight - viewport.top - viewport.height;

				return viewport;
			};

			// start lazy loading modules
			init();

			// expose public method to clean up this function closure
			this.stopLazyLoadingModules = destructor;

			return this;
		}

	}

};

Module.Manager.include(Module.Manager.LazyLoader);

Module.Manager.SubModuleProperties = {

	included: function included(Klass) {
		if (Klass.addCallback) {
			Klass.addCallback("beforeReady", "initSubModules");
		}
	},

	prototype: {

		initSubModules: function initSubModules() {
			if (this.options.subModulesDisabled) {
				return;
			}

			this.elementStore.setConfig({
				collections: {
					subModules: { selector: "[data-module-property]", nocache: true }
				}
			});

			var elements = this.elementStore.getCollection("subModules"),
			    i = 0, length = elements.length, name;

			for (i; i < length; i++) {
				name = elements[i].getAttribute("data-module-property");
				this._createSubModuleProperty(name, elements[i]);
			}
		},

		_createSubModuleProperty: function _createSubModuleProperty(name, element) {
			if (!name) {
				throw new Error("Missing required argument: name");
			}
			else if (!element) {
				throw new Error("Missing required argument: element");
			}

			var manager = this.constructor.getManager();
			var metaData = manager.getModuleMetaData(element);
			var module, proto = this.constructor.prototype;

			if (metaData.types.length > 1) {
				throw new Error("Sub module elements cannot have more than one type specified in data-module");
			}

			module = manager.createModule(element, metaData.types[0], metaData.options);
			module.init(element);

			if (proto[name] === null) {
				if (this.hasOwnProperty(name)) {
					throw new Error("Error creating sub module. Property " + name + " already exists.");
				}

				this[name] = module;
			}
			else if (proto[name] instanceof Array) {
				if (!this.hasOwnProperty(name)) {
					this[name] = [];
				}

				this[name].push(module);
			}
			else {
				throw new Error("Cannot create module property " + name + ". Property is neither null nor an Array in the class Prototype.");
			}

			manager.markModulesCreated(element, metaData);

			manager = module = metaData = proto = element = null;
		}

	}

};

Module.include(Module.Manager.SubModuleProperties);

/*
Lifecycle:

	1) Executed by outside code
		new Application() -> (Acquire dependencies via dependency injection)

	2) Executed by outside code
		configure()

	3) Executed by outside code
		init() -> (execute "beforeReady" callback) -> _ready() -> (publish "application.ready") -> (execute "afterReady" callback)

Example:

	1)
		a) Using dependency injection:
			var app = objectFactory.getInstance("application");
		b) No dependency injection:
			var app = new Application();
			app.moduleManager = new Module.Manager();
			app.config = new Hash();
			app.eventDispatcher = ...
			...

	2) app.configure(function(config) {
	       config.foo = "bar";
	   });

	3) window.onload = function() {
	       app.init(document);
	   };
*/
var Application = Module.extend({
	prototype: {

		actions: {
			click: [
				"createModule",
				"publishEvent"
			]
		},

		config: null,

		logger: window.console || null,

		moduleManager: null,

		objectFactory: null,

		options: {
			actionPrefix: "app",
			subModulesDisabled: true,
			focusAnythingInDefaultModule: true
		},

		destructor: function destructor() {
			if (this.moduleManager) {
				this.moduleManager.destructor(true);
				this.moduleManager = null;
			}

			if (this.objectFactory) {
				this.objectFactory.destructor();
				this.objectFactory = null;
			}

			if (this.config.handleApplicationErrors) {
				this.window.onerror = null;
			}

			this.logger = this.config = null;

			Module.prototype.destructor.call(this, true);
		},

		_ready: function _ready() {
			Module.prototype._ready.call(this);

			if (this.delegator.constructor.errorDelegate === null && this.config.handleActionErrors) {
				this.delegator.constructor.errorDelegate = this;
			}

			if (this.config.handleApplicationErrors) {
				this.window.onerror = this.handleError.bind(this);
			}

			try {
				this.moduleManager.init();

				if (this.config.eagerLoadModules) {
					this.moduleManager.eagerLoadModules(this.element);
				}

				if (this.config.lazyLoadModules) {
					this.moduleManager.lazyLoadModules(this.element);
				}

				this.subscribe("application.createModule", this, "handleCreateModule");

				this.moduleManager.focusDefaultModule(this.options.focusAnythingInDefaultModule);

				// Tell the world: "I'm Here!"
				this.publish("application.ready");
			}
			catch (error) {
				if (!this.handleError(error)) {
					throw error;
				}
			}
		},

		configure: function configure(callback, context) {
			callback.call(context || this, this.config, this);

			return this;
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
		createModule: function createModule(event, element, params) {
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
		_createModuleFromConfig: function _createModuleFromConfig(config) {
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
			var template = this.elementStore.querySelector(selector);
			var element = this.document.createElement(config.element.tag);

			if (!template) {
				throw new Error("Failed to find new module template using selector: " + selector);
			}

			if (config.container.selector) {
				container = this.elementStore.querySelector(config.container.selector);
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

			event = element = config = container = rootElement = null;

			return module;
		},

		_getErrorObject: function _getErrorObject(errorMessage) {
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

		handleActionError: function handleActionError(event, element, params) {
			if (this.logger) {
				this.logger.debug({
					event: event,
					element: element,
					params: params
				});

				this.logger.error(params.error);
			}
			else {
				throw params.error;
			}
		},

		handleCreateModule: function handleCreateModule(event) {
			this._createModuleFromConfig(event.data);

			return false;
		},

		handleError: function handleError(errorMessage) {
			var error = typeof errorMessage === "string" ? this._getErrorObject(errorMessage) : errorMessage;

			this._handleError(error);
		},

		_handleError: function _handleError(error) {
			if (this.logger) {
				this.logger.error(error);

				return true;
			}

			return false;
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
		publishEvent: function publishEvent(event, element, params) {
			if (!params.event) {
				throw new Error("Missing required argument params.event");
			}

			event.stop();
			this.constructor.publish(params.event, element, params.data || {});
		}
	}
});
