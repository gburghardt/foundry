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
					_scrollElement = _document.getElementsByTagName("html")[0];
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
