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
