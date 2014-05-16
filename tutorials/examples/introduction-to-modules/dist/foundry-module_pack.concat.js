/*! foundry 2014-05-16 */
(function() {

var AutoFillSelectModule = Module.Base.extend({

	prototype: {

		options: {
			charset: "utf-8",
			dataLabelKey: "label",
			dataRootKey: null,
			dataValueKey: "value",
			busyClass: "autofill-busy",
			busyText: "Please wait...",
			defaultText: "Choose",
			pendingClass: "autofill-pending",
			pendingText: "..."
		},

		onControllerRegistered: function(frontController, controllerId) {
			frontController.registerEvents("change");
		},

		populate: function change(event, element, params) {
			var source = event.target,
			    groupName = source.getAttribute("data-autofill-group"),
			    group, target;

			if (!groupName) {
				return;
			}

			group = new Group(this.element, groupName);
			target = group.getTarget(source);

			if (!target) {
				return;
			}

			this._fill(group, source, target);
		},

		_getValue: function(select) {
			var value = null;

			if (select.multiple) {
				value = [];

				for (var i = 0; i < select.options.length; i++) {
					if (select.options[i].selected) {
						value.push(select.options[i].value);
					}
				}
			}
			else {
				value = select.value;
			}

			return value;
		},

		_fill: function(group, source, target) {
			var xhr    = new XMLHttpRequest(),
				url    = source.getAttribute("data-autofill-url")
				method = (source.getAttribute("data-autofill-method") || "GET").toUpperCase(),
				param  = source.getAttribute("data-autofill-param")   || source.name,
				value  = this._getValue(source),
				self   = this,
				data   = null,
				onreadystatechange = function() {
					if (this.readyState < 4) {
						return;
					}
					else if (this.status === 200) {
						success();
						complete();
					}
					else if (this.status >= 400) {
						error();
						complete();
						throw new Error("Request to " + method + " " + url + " failed with status: " + this.status);
					}
				},
				success = function() {
					var type = xhr.getResponseHeader("content-type");

					if (/(text|application)\/json/i.test(type)) {
						self._fillFromData(JSON.parse(xhr.responseText), group, source, target);
					}
					else if (/text\/html/i.test(type)) {
						self._fillFromHtml(xhr.responseText, group, source, target);
					}
					else {
						throw new Error("Unknown content-type: " + type);
					}

					target.classList.remove(self.options.busyClass);
					target.disabled = false;
				},
				error = function() {
				},
				complete = function() {
					group.destructor();
					xhr = xhr.onreadystatechange = self = group = source = target = null;
				};

			this._markTargetBusy(target, group);

			if (!url) {
				throw new Error("Missing required attribute: data-autofill-url (" + source.name + ")");
			}

			if (value instanceof Array) {
				data = [];

				for (var i = 0, length = value.length; i < length; i++) {
					data.push(this.window.encodeURIComponent(param) + "=" + this.window.encodeURIComponent(value[i]));
				}

				data = data.join("&");
			}
			else {
				data = this.window.encodeURIComponent(param) + "=" + this.window.encodeURIComponent(value);
			}

			if (method === "GET") {
				url += (url.indexOf("?") === -1 ? "?" : "&") + data;
			}

			xhr.onreadystatechange = onreadystatechange;
			xhr.open(method, url);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

			if (method === "POST") {
				xhr.setRequestHeader("Content-Type: application/x-www-form-urlencoded; charset=" + this.options.charset);
			}

			xhr.send(data);
		},

		_fillFromData: function(data, group, source, target) {
			data = this.options.dataRootKey
			     ? data[this.options.dataRootKey]
			     : data;

			var label = this.options.dataLabelKey,
			    value = this.options.dataValueKey,
			    i = 0, length = data.length,
			    placeholder = target.getAttribute("data-autofill-placeholder") || this.options.defaultText,
			    option;

			utils.emptyNode(target);

			// create "default" option
			option = utils.createOption("", placeholder, this.document);
			target.appendChild(option)

			// fill options
			for (i; i < length; i++) {
				option = utils.createOption(data[i][value], data[i][label], this.document);
				target.appendChild(option);
			}
		},

		_fillFromHtml: function(html, group, source, target) {
			target.innerHTML = html;
		},

		_markTargetBusy: function(target, group) {
			target.classList.remove(this.options.pendingClass);
			target.classList.add(this.options.busyClass);
			target.options[0].innerHTML = this.options.busyText;
			target.disabled = true;

			group.forEachTarget(target, function(t) {
				utils.emptyNode(t);
				t.appendChild(
					utils.createOption("", this.options.pendingText, this.document));
				t.classList.remove(this.options.busyClass);
				t.classList.add(this.options.pendingClass);
				t.disabled = true;
			}, this);
		}

	}

});

function Group(element, name) {
	this.element = element || null;
	this.name = name || null;
}

Group.prototype = {

	element: null,

	name: null,

	_selects: null,

	constructor: Group,

	destructor: function() {
		this._selects = this.element = null;
	},

	getSelects: function() {
		return this._selects || (this._selects = this.element.querySelectorAll("select[data-autofill-group=" + this.name + "]"));
	},

	getTarget: function(select) {
		var target = select.getAttribute("data-autofill-target"),
		    selects = this.getSelects(),
		    i = 0,
		    targetSelect = null;

		if (target) {
			for (i; i < selects.length; i++) {
				if (selects[i].name === target) {
					targetSelect = selects[i];
					break;
				}
			}
		}

		return targetSelect;
	},

	forEachTarget: function(select, callback, context) {
		context = context || this;
		var target = select;

		while (target = this.getTarget(target)) {
			if (callback.call(context, target, select, this) === false) {
				break;
			}
		}
	}

};

var utils = {
	createOption: function(value, label, document) {
		var option = document.createElement("option");
		option.value = value;
		option.innerHTML = label;

		return option;
	},
	emptyNode: function(node) {
		while (node.childNodes.length) {
			node.removeChild(node.lastChild);
		}
	}
};

Module.AutoFillSelectModule = AutoFillSelectModule;

})();

Module.DetailsModule = Module.Base.extend({

	prototype: {

		identifierPrefix: "details",

		lastRequest: null,

		options: {
			autoLoad: true,
			url: null,
			method: "GET",
			view: null,
			identifier: null
		},

		view: null,

		xhr: null,

		_ready: function() {
			Module.Base.prototype._ready.call(this);

			if (!this.options.url) {
				throw new Error("Missing required option: url");
			}

			if (this.options.identifier) {
				this.subscribe(this.identifierPrefix + "." + this.options.identifier + ".changed", this, this.handleDetailsChanged);
			}

			if (this.options.autoLoad) {
				this._loadFromUrl(this.options.url, this.options.method, this.element);
			}
		},

		destructor: function (keepElement) {
			if (this.xhr) {
				this.xhr.abort();
				this.xhr = null;
			}

			this.lastRequest = null;

			Module.Base.prototype.destructor.call(this, keepElement);
		},

		close: function click(event, element, params) {
			event.stop();
			this.destructor();
		},

		_getView: function() {
			return this.options.view || this.view;
		},

		handleDetailsChanged: function(publisher, data) {
			this._retry(this.lastRequest);
		},

		load: function click(event, element, params) {
			if (params.stop) {
				event.stop();
			}
			else {
				event.preventDefault();
			}

			var url = element.getAttribute("href") || element.getAttribute("data-details-url"),
			    method = element.getAttribute("data-details-method") || "GET";

			this._loadFromUrl(url, method, this.element);
		},

		_loadFromUrl: function(url, method, target) {
			this.lastRequest = { url: url, method: method, target: target };
			this._loading(target);

			if (this.xhr) {
				this.xhr.abort();
			}

			var	xhr = new XMLHttpRequest(),
				self = this,
				found = function() {
					var type = xhr.getResponseHeader("content-type");

					if (/text\/html/.test(type)) {
						target.innerHTML = xhr.responseText;
						complete();
					}
					else if (/(text|application)\/json/.test(type)) {
						var view = self._getView();

						if (!view) {
							throw new Error("Missing one of view or options.view");
						}

						self.render(view, JSON.parse(xhr.responseText), target)
							.done(function() {
								complete();
							});
					}
					else {
						complete();
						throw new Error("Unknown HTTP response type: " + type);
					}
				},
				notFound = function() {
					target.innerHTML = xhr.responseText;
					complete();
				},
				error = function() {
					self.element.innerHTML = [
						'<p class="details-error">',
							'An unknown problem occurred. ',
							'<button type="button" data-actions="' + self.controllerId + '.retry">Try Again</button>',
						'</p>'
					].join("");

					complete();
				},
				complete = function() {
					self._loaded(target);

					target =
						xhr =
						xhr.onreadystatechange =
						self =
						self.xhr =
					null;
				},
				onreadystatechange = function() {
					if (this.readyState === 4) {
						if (this.status === 200) {
							found();
						}
						else if (this.status === 404) {
							notFound();
						}
						else {
							error();
						}
					}
				};

			this.xhr = xhr;

			xhr.onreadystatechange = onreadystatechange;
			xhr.open(method, url);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.send(null);
		},

		_retry: function(lastRequest) {
			this._loadFromUrl(lastRequest.url, lastRequest.method, lastRequest.target);
		},

		retry: function click(event, element, params) {
			event.stop();
			this._retry(this.lastRequest);
		}

	}

});

Module.FormModule = Module.Base.extend({

	prototype: {

		// actions: {
		// 	enterpress: [
		// 		"submit"
		// 	],
		// 	submit: [
		// 		"submit"
		// 	]
		// },

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

		handleClickSubmit: function click(event, element, params) {
			this.submit(event, element, params);
		},

		handleEnterpress: function enterpress(event, element, params) {
			this.submit(event, element, params);
		},

		_getData: function _getData() {
			return this.extractor.getData(this.element);
		},

		_getTransport: function _getTransport() {
			return new XMLHttpRequest();
		},

		onControllerRegistered: function(frontController, controllerId) {
			frontController.registerEvents("enterpress");
		},

		onControllerUnregistered: function(frontController) {
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

Module.InfiniteScrollModule = Module.Base.extend({

	prototype: {

		averagePageHeight: -1,

		disabled: false,

		offset: 0,

		options: {
			autoCheckScrollPosition: true,
			charset: "utf-8",
			limit: 10,
			limitParam: "limit",
			method: "GET",
			offsetParam: "offset",
			pageClassName: "infiniteScroll-page",
			period: 200,
			threshold: 500,
			url: null,
			view: null
		},

		_newPageTagNames: {
			table: "tbody",
			ol: "li",
			ul: "li"
		},

		pageContainer: null,

		scrollTimer: null,

		totalHeight: 0,

		_ready: function() {
			Module.Base.prototype._ready.call(this);

			if (!this.options.url) {
				throw new Error("Missing required option: url");
			}

			this.elementStore.returnNative = true;
			this.handleScroll = this.handleScroll.bind(this);
			this.checkScrollPosition = this.checkScrollPosition.bind(this);
			this.pageContainer = this.element.querySelector(".infiniteScroll-container");
			this.enable();
		},

		destructor: function(keepElement) {
			if (this.element) {
				this.disable();
			}

			Module.Base.prototype.destructor.call(this, keepElement);
		},

		checkScrollPosition: function() {
			this.scrollTimer = null;

			if (this._nearThreshold()) {
				this._search();
			}
		},

		_createNewPage: function() {
			var nodeName = this.pageContainer.nodeName.toLowerCase(),
			    tagName = this._newPageTagNames[nodeName] || "div",
			    page = this.document.createElement(tagName);

			if (tagName === "tbody") {
				with(page.insertRow(0)) {
					with(insertCell(0)) {
						style.height = this._getAveragePageHeight() + "px";
					}
				}
			}
			else {
				page.style.height = this._getAveragePageHeight() + "px";
			}

			page.className = this.options.pageClassName + " loading";

			return page;
		},

		disable: function() {
			this.disabled = true;

			if (this.scrollTimer) {
				this.window.clearTimeout(this.scrollTimer);
			}

			this.element.removeEventListener("scroll", this.handleScroll, false);
		},

		enable: function() {
			this.element.addEventListener("scroll", this.handleScroll, false);

			if (this.options.autoCheckScrollPosition) {
				this.checkScrollPosition();
			}

			this.disabled = false;
		},

		_getAveragePageHeight: function() {
			if (this.averagePageHeight < 0) {
				var pages = this._getPages(),
				    i = 0, length = pages.length,
				    total = 0;

				for (i; i < length; i++) {
					total += pages[i].offsetHeight;
				}

				this.totalHeight = total;
				this.averagePageHeight = Math.round(total / pages.length);
			}

			return this.averagePageHeight;
		},

		_getPages: function() {
			return this.pageContainer
				.querySelectorAll("." + this.options.pageClassName);
		},

		handleScroll: function(event) {
			console.log("scrolled");

			if (this.scrollTimer) {
				this.window.clearTimeout(this.scrollTimer);
			}

			this.scrollTimer = this.window.setTimeout(this.checkScrollPosition, this.options.period);
		},

		_nearThreshold: function() {
			return (this.element.scrollHeight - this.element.clientHeight - this.element.scrollTop <= this.options.threshold);
		},

		_search: function() {
			var offset = this.offset++,
			    offsetParam = this.options.offsetParam,
			    limit = this.options.limit,
			    limitParam = this.options.limitParam,
			    params = this.window.escape(limitParam) + "=" + limit
			           + "&" + this.window.escape(offsetParam) + "=" + offset;
			    url = this.options.url,
			    method = (this.options.method || "GET").toUpperCase(),
			    xhr = new XMLHttpRequest(),
			    page = this._createNewPage(),
			    self = this,
			    onreadystatechange = function() {
			    	if (this.readyState < 4) {
			    		return;
			    	}
			    	else if (this.status === 200) {
			    		success();
			    		complete();
			    	}
			    	else if (this.status === 404) {
			    		// We've reached the end of the line. No more results to show.
			    		page.parentNode.removeChild(page);
			    		self.offset--;
			    		self.disable();
			    		complete();
			    	}
			    	else if (this.status >= 400) {
			    		complete();
			    		throw new Error("Request " + method + " " + url + " failed with status: " + xhr.status);
			    	}
			    },
			    success = function() {
			    	var type = xhr.getResponseHeader("content-type");

			    	if (/text\/html/i.test(type)) {
			    		page.innerHTML = xhr.responseText;
			    		afterPageRendered();
			    	}
			    	else if (/(application|text)\/json/i.test(type)) {
			    		if (!self.options.view) {
			    			throw new Error("Missing required option: view");
			    		}

			    		self.render(self.options.view, JSON.parse(xhr.responseText), page)
			    			.done(afterPageRendered);
			    	}
			    	else {
			    		throw new Error("Unknown content-type: " + type);
			    	}
			    },
			    afterPageRendered = function() {
			    	page.style.height = "";
			    	self._loaded(page);
			    	self._updateAverageHeight(page);
			    },
			    complete = function() {
			    	xhr = xhr.onreadystatechange = page = self = null;
			    };

			this.pageContainer.appendChild(page);

			if (method === "GET") {
				url += ((url.indexOf("?") === -1) ? "?" : "&") + params;
			}

			xhr.onreadystatechange = onreadystatechange;
			xhr.open(method, url);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

			if (method === "POST") {
				xhr.setRequestHeader("Content-Type: application/x-www-form-urlencoded; charset=" + this.options.charset);
				xhr.send(params);
			}
			else {
				xhr.send(null);
			}
		},

		_updateAverageHeight: function(page) {
			this.totalHeight += page.offsetHeight;
			this.averagePageHeight = Math.round(this.totalHeight / (this.offset + 1));
		}

	}

});

Module.SelectionModule = Module.Base.extend({

	prototype: {

		elementStore: {
			elements: {
				list: { selector: "ol.selection-items" },
				removedItemList: { selector: "ol.selection-removed-items" }
			},
			collections: {
				items: { selector: "ol.selection-items>li" },
				selectedItems: { selector: "ol.selection-items>li.selected", nocache: true }
			}
		},

		options: {
			listTagName: "ol",
			selectedClass: "selected",
			hideOnRemoval: false,
			destroyHiddenFieldRegex: /_destroy\]$/,
			destroyHiddenFieldValue: 1,
			confirmOnRemove: false,
			singleRemovalConfirm: "Are you sure you want to remove this item?",
			bulkRemovalConfirm: "Are you sure you want to remove these items?"
		},

		_ready: function() {
			Module.Base.prototype._ready.call(this);

			this.elementStore.returnNative = true;

			if (this.options.hideOnRemoval && !this.removedItemList()) {
				var removedItemList = this.document.createElement("ol");
				removedItemList.className = "selection-removed-items";
				removedItemList.style.display = "none";
				this.element.appendChild(removedItemList);
			}
		},

		deselectAll: function click(event, element, params) {
			event.preventDefault();

			var items = this.items(),
			    i = 0, length = items.length;

			for (i; i < length; i++) {
				items[i].classList.remove(this.options.selectedClass);
			}

			this.notify("selectionSizeChanged");
		},

		remove: function click(event, element, params) {
			event.stop();

			var item = element.parentNode;

			if (!this.options.confirmOnRemove || this.window.confirm(params.confirm || this.options.singleRemovalConfirm)) {
				while (item && item.nodeName != "LI") {
					item = item.parentNode;
				}

				if (item) {
					this.removeItem(item);
				}
				else {
					throw new Error("Failed to find an item to remove");
				}
			}
		},

		removeAll: function click(event, element, params) {
			event.preventDefault();

			if (!this.options.confirmOnRemove || this.window.confirm(params.confirm || this.options.bulkRemovalConfirm)) {
				var list = this.list();

				while (list.childNodes.length) {
					if (list.firstChild.nodeName === "LI") {
						this.removeItem(list.firstChild);
					}
					else {
						list.removeChild(list.firstChild);
					}
				}
			}
		},

		removeSelected: function click(event, element, params) {
			event.preventDefault();

			if (!this.options.confirmOnRemove || this.window.confirm(params.confirm || this.options.bulkRemovalConfirm)) {
				var items = this.selectedItems(),
				    i = items.length;

				while (i--) {
					this.removeItem(items[i]);
				}
			}
		},

		selectAll: function click(event, element, params) {
			event.preventDefault();

			var items = this.items(),
			    i = 0, length = items.length;

			for (i; i < length; i++) {
				items[i].classList.add(this.options.selectedClass);
			}

			this.notify("selectionSizeChanged");
		},

		toggle: function click(event, element, params) {
			if (params.stop) {
				event.stop();
			}
			else {
				event.preventDefault();
			}

			element.classList.toggle(this.options.selectedClass);
			this.notify("selectionSizeChanged");
		},

		addItem: function(item) {
			this.list().appendChild(item);
			this.clearElementStoreCache();
			this.notify("itemAdded", { item: item });
		},

		createItem: function() {
			var item = this.document.createElement("li");

			item.setAttribute("data-actions", this.controllerId + ".toggle");

			return item;
		},

		getSelectedItems: function() {
			return this.selectedItems();
		},

		getSelectionSize: function() {
			return this.selectedItems().length;
		},

		removeItem: function(item, keepCache, doNotNotify) {
			this.list().removeChild(item);

			if (this.options.hideOnRemoval) {
				var inputs = item.querySelectorAll("input[type=hidden]"),
				    i = 0, length = inputs.length;

				for (i; i < length; i++) {
					if (this.options.destroyHiddenFieldRegex.test(inputs[i].name)) {
						inputs[i].value = this.options.destroyHiddenFieldValue;
						break;
					}
				}

				this.removedItemList().appendChild(item);
			}

			if (!keepCache) {
				this.clearElementStoreCache();
			}

			if (!doNotNotify) {
				this.notify("itemRemoved", { item: item });
			}
		}

	}

});

Module.SlideshowModule = function() {

var _zIndex = 1000;

/**
 * class Module.SlideshowModule < Module.Base, Module.IModule
 **/
var SlideshowModule = Module.Base.extend({

	self: {
		_defaultSlideFactory: null,

		getDefaultSlideFactory: function() {
			return this._defaultSlideFactory || (this._defaultSlideFactory = new SlideFactory());
		}
	},

	prototype: {

		KEY_CODE_ESCAPE: 27,
		KEY_CODE_LEFT: 37,
		KEY_CODE_RIGHT: 39,
		KEY_CODE_SPACEBAR: 32,

		captionsEnabled: true,

		currentSlide: null,

		elementStore: {
			elements: {
				disableCaptionsButton: { selector: ".slideshow-tool-captions-off" },
				enableCaptionsButton: { selector: ".slideshow-tool-captions-on" },
				fullScreenNote: { selector: "em.slideshow-fullscreen-note" },
				pauseButton: { selector: ".slideshow-tool-pause" },
				playButton: { selector: ".slideshow-tool-play" },
				slideContainer: { selector: ".slideshow-container" },
				toolbar: { selector: ".slideshow-tools" }
			}
		},

		fullScreenNoteTimer: null,

		options: {
			autoPlay: false,
			delay: 5000,
			fullScreenNoteDelay: 3000,
			loop: true,
			method: null,
			toggleFullScreenDelay: 100,
			url: null,
			view: null,
			zIndex: 0
		},

		playTimer: null,

		slideFactory: null,

		transition: null,

		_ready: function() {
			Module.Base.prototype._ready.call(this);

			this.elementStore.returnNative = true;
			this.transition = this.transition || new ShowHideTransition();
			this.slideFactory = this.slideFactory || SlideshowModule.getDefaultSlideFactory();
			this.playButton().style.display = "";
			this.pauseButton().style.display = "none";
			this._setZIndex(this.options.zIndex || _zIndex++);
			this.handleKeyUp = this.handleKeyUp.bind(this);

			if (this.options.url) {
				this._loadFromUrl();
			}
			else {
				this._createFirstSlide();
			}
		},

		destructor: function(keepElement) {
			if (this.document) {
				this.document.removeEventListener("keyup", this.handleKeyUp, false);
			}

			if (this.playTimer) {
				this._stopSlideshow();
			}

			if (this.fullScreenNoteTimer) {
				this.window.clearTimeout(this.fullScreenNoteTimer);
				this.fullScreenNoteTimer = null;
			}

			this.slideFactory =
				this.currentSlide =
				this.transition =
			null;

			Module.Base.prototype.destructor.call(this, keepElement);
		},

		captionsOff: function click(event, element, params) {
			event.stop();
			this.captionsEnabled = false;
			this.disableCaptionsButton().style.display = "none";
			this.enableCaptionsButton().style.display = "";
			this._setCurrentSlide(this.currentSlide);
		},

		captionsOn: function click(event, element, params) {
			event.stop();
			this.captionsEnabled = true;
			this.disableCaptionsButton().style.display = "";
			this.enableCaptionsButton().style.display = "none";
			this._setCurrentSlide(this.currentSlide);
		},

		enterFullScreen: function click(event, element, params) {
			event.stop();
			this.showFullScreen();
		},

		exitFullScreen: function click(event, element, params) {
			event.stop();
			this.showSmallScreen();
		},

		next: function click(event, element, params) {
			event.stop();
			this._stopSlideshow();
			this._showNextSlide();
		},

		pause: function click(event, element, params) {
			event.stop();
			this._stopSlideshow();
		},

		play: function click(event, element, params) {
			event.stop();
			this._playSlideshow();
		},

		prev: function click(event, element, params) {
			event.stop();
			this._stopSlideshow();
			this._showPrevSlide();
		},

		_createFirstSlide: function() {
			this._loaded();
			this._setCurrentSlide(this.slideFactory.create(this.slideContainer()));

			if (!this.currentSlide) {
				throw new Error("No slides were found");
			}

			if (this.options.autoPlay) {
				this._playSlideshow();
			}
		},

		handleHideFullScreenNote: function() {
			this.fullScreenNote().style.display = "none";
			this.fullScreenNoteTimer = null;
		},

		handleKeyUp: function(event) {
			var keyCode = event.keyCode;

			if (this.KEY_CODE_ESCAPE === keyCode) {
				this.showSmallScreen();
			}
			else if (this.KEY_CODE_LEFT === keyCode) {
				this._stopSlideshow();
				this._showPrevSlide();
			}
			else if (this.KEY_CODE_RIGHT === keyCode) {
				this._stopSlideshow();
				this._showNextSlide();
			}
			else if (this.KEY_CODE_SPACEBAR === keyCode) {
				if (this.playTimer) {
					this._stopSlideshow();
				}
				else {
					this._playSlideshow();
				}
			}
		},

		handleShowNextSlide: function() {
			this._showNextSlide();
			this._playSlideshow();
		},

		_loadFromUrl: function() {
			this._loading(this.slideContainer());

			var url = this.options.url,
			    method = (this.options.method || "GET").toUpperCase(),
			    xhr = new XMLHttpRequest(),
			    self = this,
			    onreadystatechange = function() {
			    	if (this.readyState < 4) {
			    		return;
			    	}
			    	else if (this.status === 200) {
			    		success();
			    	}
			    	else if (this.status >= 400) {
			    		complete();
			    		throw new Error("Request to " + method + " " + url + " failed with status: " + this.status);
			    	}
			    },
			    success = function() {
			    	var type = xhr.getRequestHeader("content-type");

			    	if (/(application|text)\/json/i.test(type)) {
			    		self.render(self.options.view, JSON.parse(xhr.responseText), self.slideContainer())
			    			.done(function() {
			    				self._loaded(self.slideContainer());
			    				complete();
			    			});
			    	}
			    	else if (/test\/html/i.test(type)) {
			    		self.slideContainer().innerHTML = xhr.responseText;
			    		complete();
			    	}
			    },
			    complete = function() {
			    	xhr = self = null;
			    };

			xhr.onreadystatechange = onreadystatechange;
			xhr.open(method, url);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			xhr.send(null);
		},

		_playSlideshow: function() {
			this.playButton().style.display = "none";
			this.pauseButton().style.display = "";
			this.playTimer = this.window.setTimeout(this.handleShowNextSlide.bind(this), this.options.delay);
		},

		_setCurrentSlide: function(slide) {
			if (this.currentSlide) {
				this.currentSlide.removeClass("slideshow-current");
			}

			if (this.captionsEnabled) {
				slide.showCaption();
			}
			else {
				slide.hideCaption();
			}

			slide.addClass("slideshow-current");

			this.currentSlide = slide;
		},

		_setZIndex: function(value) {
			this.options.zIndex =
			this.element.style.zIndex =
			this.slideContainer().style.zIndex = value;
			this.fullScreenNote().style.zIndex = value + 1;
		},

		showFullScreen: function() {
			this.fullScreenNote().style.display = "";
			this.element.classList.add("slideshow-fullscreen");
			this._toggleImageUrls("data-fullscreen-src", "data-smallscreen-src");
			this._setZIndex(this.options.zIndex + 100);
			this.document.addEventListener("keyup", this.handleKeyUp, false);
			this.fullScreenNoteTimer = this.window.setTimeout(
				this.handleHideFullScreenNote.bind(this), this.options.fullScreenNoteDelay);
		},

		_showNextSlide: function() {
			if (this.transitioning) {
				return;
			}

			var currentSlide = this.currentSlide,
			    nextSlide = currentSlide.nextSlide();

			if (!nextSlide && this.options.loop) {
				nextSlide = currentSlide.firstSlide();
			}

			if (nextSlide) {
				this._transition(currentSlide, nextSlide, 1);
			}
		},

		_showPrevSlide: function() {
			if (this.transitioning) {
				return;
			}

			var currentSlide = this.currentSlide,
			    prevSlide = this.currentSlide.prevSlide();

			if (!prevSlide && this.options.loop) {
				prevSlide = this.currentSlide.lastSlide();
			}

			if (prevSlide) {
				this._transition(currentSlide, prevSlide, -1);
			}
		},

		showSmallScreen: function() {
			this.window.clearTimeout(this.fullScreenNoteTimer);
			this.fullScreenNoteTimer = null;
			this.element.classList.remove("slideshow-fullscreen");
			this.fullScreenNote().style.display = "none";
			this._toggleImageUrls("data-smallscreen-src", "data-fullscreen-src");
			this._setZIndex(this.options.zIndex - 100);
			this.document.removeEventListener("keyup", this.handleKeyUp, false);
		},

		_stopSlideshow: function() {
			if (this.playTimer) {
				this.playButton().style.display = "";
				this.pauseButton().style.display = "none";
				this.window.clearTimeout(this.playTimer);
				this.playTimer = null;
			}
		},

		_toggleImageUrls: function(newUrlAttr, oldUrlAttr) {
			var images = this.slideContainer().querySelectorAll("img[" + newUrlAttr + "]"),
			    i = 0,
			    length = images.length,
			    self = this,
			    interval = this.options.toggleFullScreenDelay,
			    callback = function() {
			    	images[i].setAttribute(oldUrlAttr, images[i].src);
					images[i].src = images[i].getAttribute(newUrlAttr);
			    	i++;

			    	if (i < length) {
			    		self.window.setTimeout(callback, interval);
			    	}
			    	else {
			    		images = event = element = params = callback = null;
			    	}
			    };

			this.window.setTimeout(callback, interval);
		},

		_transition: function(from, to, direction) {
			if (!this.transition) {
				return;
			}
			else if (this.transitioning) {
				this.transition.stop();
			}

			this.transitioning = true;
			this.transition.start(from, to, direction, function() {
				this.transitioning = false;
				this._setCurrentSlide(to);

				if (this._playTimer) {
					this._playSlideshow();
				}
			}, this);
		}

	}

});

function SlideFactory() {
}

SlideFactory.prototype = {
	constructor: SlideFactory,

	create: function(slideContainer) {
		var slide = null, image = null, caption = null;

		switch (slideContainer.nodeName) {
		case "DL":
			image = slideContainer.querySelector("dt");
			caption = slideContainer.querySelector("dd");
			slide = new DefinitionListSlide(slideContainer, image, caption);
			break;
		case "DIV":
			image = slideContainer.querySelector("a, img");
			caption = slideContainer.querySelector("figcaption");
			slide = new FigureSlide(slideContainer, image, caption);
			break;
		default:
			break;
		}

		return slide;
	}
};

function AbstractSlide(container, image, caption) {
	this.setContainer(container);
	this.setImage(image);
	this.setCaption(caption);
}

AbstractSlide.prototype = {

	caption: null,

	container: null,

	image: null,

	next: null,

	prev: null,

	constructor: AbstractSlide,

	addClass: function(className) {
		return this._alterClassName("add", className);
	},

	_alterClassName: function(method, className) {
		this.image.classList[method](className);

		if (this.caption) {
			this.caption.classList[method](className);
		}

		return this;
	},

	_createNextSlide: function() {
		throw new Error("Not Implemented");
	},

	_createPrevSlide: function() {
		throw new Error("Not Implemented");
	},

	_findNextSibling: function(element, tagNamesRegex) {
		var sibling = element;

		while (sibling = sibling.nextSibling) {
			if (tagNamesRegex.test(sibling.nodeName)) {
				break;
			}
		}

		return sibling;
	},

	_findPrevSibling: function(element, tagNamesRegex) {
		var sibling = element;

		while (sibling = sibling.previousSibling) {
			if (tagNamesRegex.test(sibling.nodeName)) {
				break;
			}
		}

		return sibling;
	},

	firstSlide: function() {
		var slide = this, firstSlide = this;

		while (slide = slide.prevSlide()) {
			firstSlide = slide;
		}

		return firstSlide;
	},

	getTransitionElements: function() {
		throw new Error("Not Implemented");
	},

	hideCaption: function() {
		if (this.caption) {
			this.caption.style.display = "none";
		}

		return this;
	},

	lastSlide: function() {
		var slide = this, lastSlide = this;

		while (slide = slide.nextSlide()) {
			lastSlide = slide;
		}

		return lastSlide;
	},

	nextSlide: function() {
		if (!this.next) {
			this.next = this._createNextSlide();
		}

		return this.next;
	},

	prevSlide: function() {
		if (!this.prev) {
			this.prev = this._createPrevSlide();
		}

		return this.prev;
	},

	removeClass: function(className) {
		return this._alterClassName("remove", className);
	},

	setCaption: function(caption) {
		this.caption = caption;
		return this;
	},

	setImage: function(image) {
		this.image = image;
		return this;
	},

	showCaption: function() {
		if (this.caption) {
			this.caption.style.display = "";
		}

		return this;
	},

	setContainer: function(container) {
		this.container = container;
		return this;
	}

};

var DefinitionListSlide = AbstractSlide.extend({
	prototype: {
		initialize: function(container, image, caption) {
			AbstractSlide.call(this, container, image, caption);
		},

		getTransitionElements: function() {
			return this.caption ? [this.image, this.caption] : [this.image];
		},

		_createNextSlide: function() {
			var image = this._findNextSibling(this.caption, /DT/),
			    caption = null,
			    slide = null;

			if (image) {
				caption = this._findNextSibling(image, /DD/);
				slide = new DefinitionListSlide(this.container, image, caption);
			}

			return slide;
		},

		_createPrevSlide: function() {
			var captionOrImage = this._findPrevSibling(this.image, /DD|DT/),
			    image = null, caption = null, slide = null;

			if (captionOrImage) {
				if (captionOrImage.nodeName === "DD") {
					caption = captionOrImage;
					image = this._findPrevSibling(caption, /DT/);
					slide = new DefinitionListSlide(this.container, image, caption);
				}
				else {
					image = captionOrImage;
					caption = this._findNextSibling(image, /DD/);
					slide = new DefinitionListSlide(this.container, image, caption);
				}
			}

			return slide;
		}
	}
});

var FigureSlide = AbstractSlide.extend({
	prototype: {
		figure: null,

		initialize: function(container, image, caption) {
			AbstractSlide.call(this, container, image, caption);
		},

		getTransitionElements: function() {
			return [this.figure];
		},

		_alterClassName: function(method, className) {
			this.figure.classList[method](className);
		},

		_createNextSlide: function() {
			var figure = this._findNextSibling(this.figure, /FIGURE/),
			    image = null, caption = null, slide = null;

			if (figure) {
				image = figure.querySelector("a, img");
				caption = figure.querySelector("figcaption");
				slide = new FigureSlide(this.container, image, caption);
			}

			return slide;
		},

		_createPrevSlide: function() {
			var figure = this._findPrevSibling(this.figure, /FIGURE/),
			    image = null, caption = null, slide = null;

			if (figure) {
				image = figure.querySelector("a, img");
				caption = figure.querySelector("figcaption");
				slide = new FigureSlide(this.container, image, caption);
			}

			return slide;
		},

		setCaption: function(caption) {
			AbstractSlide.prototype.setCaption.call(this, caption);
			this.figure = caption.parentNode;
		}
	}
});

function ShowHideTransition() {
}

ShowHideTransition.prototype = {

	callback: null,

	context: null,

	constructor: ShowHideTransition,

	_toggle: function(elements, display) {
		for (var i = 0; i < elements.length; i++) {
			elements[i].style.display = display;
		}
	},

	start: function(from, to, direction, callback, context) {
		this.callback = callback;
		this.context = context;

		this._toggle(from.getTransitionElements(), "none");
		this._toggle(to.getTransitionElements(), "block");

		callback.call(context, this);
	},

	stop: function() {
		this.callback.call(this.context, this);
	}

};

// Make classes publically available
SlideshowModule.AbstractSlide = AbstractSlide;
SlideshowModule.FigureSlide = FigureSlide;
SlideshowModule.DefinitionListSlide = DefinitionListSlide;
SlideshowModule.SlideFactory = SlideFactory;
SlideshowModule.ShowHideTransition = ShowHideTransition;

return SlideshowModule;

}();
