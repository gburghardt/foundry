describe("TaskListModule", function() {

	var module,
	    element,
	    event,
	    params,
	    win,
	    doc;

	function FauxEvent(type, target) {
		this.type = type;
		this.target = target;
	}
	FauxEvent.prototype = {
		type: null,
		target: null,
		constructor: FauxEvent,
		preventDefault: function() {},
		stopPropagation: function() {},
		stop: function() {} // required by the front controller
	};

	beforeEach(function() {
		element = document.createElement("div");
		module = new TaskListModule();
	});

	describe("add", function() {

		beforeEach(function() {
			MockingBird.XMLHttpRequest.disableNetworkConnections();

			doc = {
				createElement: function() {}
			};
			win = {
				encodeURIComponent: function(x) {
					return encodeURIComponent(x);
				},
				alert: function() {}
			};
			module.init(element);
			module.document = doc;
			module.window = win;
			event = new FauxEvent("submit", element);
			params = {};
		});

		afterEach(function() {
			MockingBird.XMLHttpRequest.enableNetworkConnections();
		});

		it("tells the user to enter a valid task name", function() {
			spyOn(win, "alert");
			element.innerHTML = '<input type="text" name="taskName">';

			module.add(event, element, params);

			expect(win.alert).toHaveBeenCalled();
		});

		it("adds a task", function() {
			var ol = document.createElement("ol"),
		        li = document.createElement("li");

			MockingBird.XMLHttpRequest.mock("/tasks", "POST", {
				status: 201,
				body: "created"
			});

			spyOn(element, "querySelector").and.returnValue(ol);
			spyOn(doc, "createElement").and.returnValue(li);

			module.add(event, element, params);

			expect(ol.firstChild).toBe(li);
		});

		it("tells the user when something went wrong", function() {
			MockingBird.XMLHttpRequest.mock("/tasks", "POST", {
				status: 500,
				body: "Server Error"
			});

			element.innerHTML = [
				'<input type="text" name="taskName" value="Take out the garbage">',
				'<ol></ol>'
			].join("");

			spyOn(win, "alert");
			spyOn(doc, "createElement").and.returnValue(document.createElement("li"));

			module.add(event, element, params);

			expect(win.alert).toHaveBeenCalledWith("Failed to save task (Error 500)");
		});

	});

});
