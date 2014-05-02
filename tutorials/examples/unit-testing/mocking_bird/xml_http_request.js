MockingBird.XMLHttpRequest = function XMLHttpRequest(options) {
	this._requestHeaders = {};
	this._responseHeaders = {};

	if (options) {
		this._setOptions(options);
	}
};

MockingBird.XMLHttpRequest.OrigXMLHttpRequest = null;
MockingBird.XMLHttpRequest.enabledCallback = null;
MockingBird.XMLHttpRequest.mocks = {};

MockingBird.XMLHttpRequest.disableNetworkConnections = function disableNetworkConnections(callback, context) {
	this.OrigXMLHttpRequest = window.XMLHttpRequest;
	window.XMLHttpRequest = MockingBird.XMLHttpRequest;

	if (callback || context) {
		this.enabledCallback = {
			context: context,
			callback: callback
		};
	}

	return this;
};

MockingBird.XMLHttpRequest.enableNetworkConnections = function enableNetworkConnections() {
	window.XMLHttpRequest = this.OrigXMLHttpRequest;

	if (this.enabledCallback) {
		this.enabledCallback.callback.call(this.enabledCallback.context);
	}

	return this;
};

MockingBird.XMLHttpRequest.getMock = function getMock(url, method) {
	var key = method.toUpperCase() + " " + url;

	return this.mocks[key] || null;
};

MockingBird.XMLHttpRequest.mock = function mock(url, method, options) {
	var key = method.toUpperCase() + " " + url;
	this.mocks[key] = options;
	return this;
};

MockingBird.XMLHttpRequest.prototype = {

	_async: true,

	_body: "",

	_status: 200,

	_method: null,

	_requestHeaders: null,

	_responseHeaders: null,

	_data: null,

	_url: null,

	constructor: MockingBird.XMLHttpRequest,

	// Test setup methods

	returnsStatus: function returnsStatus(endingStatus) {
		this._status = endingStatus;
		return this;
	},

	returnsBody: function returnsBody(body) {
		this._body = typeof body === "object" ? JSON.stringify(body) : body;
		return this;
	},

	returnsHeaders: function returnsHeaders(headers) {
		for (var key in headers) {
			if (headers.hasOwnProperty(key)) {
				this._responseHeaders[key] = headers[key];
			}
		}

		return this;
	},

	sendsHeaders: function sendsHeaders(headers) {
		for (var key in headers) {
			if (headers.hasOwnProperty(key)) {
				this._requestHeaders[key] = headers[key];
			}
		}

		return this;
	},

	_changeState: function _changeState(readyState, status) {
		this.readyState = readyState;
		this.status = status;

		if (this.readyState === 4) {
			this.responseText = this._body;
			this.responseXML = this._parseResponseText();
		}

		this.onreadystatechange();
	},

	_parseResponseText: function _parseResponseText() {
		try {
			var parser = new DOMParser();
			this.responseXML = parser.parseFromString(this.responseText, "application/xml");
		}
		catch (error) {
			this.responseXML = null;
		}
	},

	_resetRequest: function _resetRequest() {
		this.readyState = 0;
		this.status = 0;
		this.responseText = null;
		this.responseXML = null;
	},

	_sendMockRequest: function _sendMockRequest() {
		this._changeState(1, this.status);
		this._changeState(2, this.status);
		this._changeState(3, this.status);
		this._changeState(4, this._status);
	},

	_setOptions: function _setOptions(options) {
		if (options.hasOwnProperty("body")) {
			this.returnsBody(options.body);
		}

		if (options.hasOwnProperty("status")) {
			this.returnsStatus(options.status);
		}

		if (options.hasOwnProperty("requestHeaders")) {
			this.sendsHeaders(options.requestHeaders);
		}

		if (options.hasOwnProperty("responseHeaders")) {
			this.returnsHeaders(options.responseHeaders);
		}
	},

	// Standard XMLHttpRequest interface

	DONE: 4,

	HEADERS_RECEIVED: 2,

	LOADING: 3,

	OPENED: 1,

	UNSENT: 0,

	readyState: 0,

	responseText: null,

	responseXML: null,

	status: 0,

	onreadystatechange: function onreadystatechange() {},

	abort: function abort() {
		this._resetRequest();
		this._changeStatus(0, 0);
	},

	getResponseHeader: function getResponseHeader(name) {
		return this._responseHeaders[name] || null;
	},

	getRequestHeader: function getRequestHeader(name) {
		return this._requestHeaders[name] || null;
	},

	setRequestHeader: function setRequestHeader(name, value) {
		this._requestHeaders[name] = value;
	},

	open: function open(method, url, async) {
		this._method = method;
		this._url = url;
		this._async = async;

		var options = this.constructor.getMock(url, method);

		if (options) {
			this._setOptions(options);
		}
	},

	send: function send(data) {
		this._data = data;
		this._sendMockRequest();
	}

};
