describe("Application", function() {

	describe("_getErrorObject", function() {

		beforeEach(function() {
			this.application = new Application();
		});

		it("throws an Error if the error class name cannot be found", function() {
			var app = this.application;

			expect(function() {
				app._getErrorObject("BadErrorClass: Something");
			}).toThrow(new Error("Class 'BadErrorClass' is either not found or not an object constructor function"));
		});

		it("returns an object of the type specified", function() {
			window.ExampleError = function ExampleError(message) {
				this.message = message;
			};

			var error = this.application._getErrorObject("ExampleError: Testing");

			expect(error instanceof ExampleError).toBe(true);
			expect(error.message).toBe("Testing");

			window.ExampleError = null;
		});

		it("returns an error object from a namespace class name", function() {
			window.__test__ = {
				authentication: {
					AuthenticationError: function(message) {
						this.message = message;
					}
				}
			};

			var error = this.application._getErrorObject("__test__.authentication.AuthenticationError: Testing");

			expect(error instanceof __test__.authentication.AuthenticationError).toBe(true);
			expect(error.message).toBe("Testing");

			window.__test__ = null;
		});

		it("throws an Error if the error class is not well formed", function() {
			window.Hacked = function() {};
			spyOn(window, "Hacked");

			var error = this.application._getErrorObject("Hacker(): Test");

			expect(error instanceof Error).toBe(true);
			expect(error.message).toBe("Hacker(): Test");
			expect(window.Hacked).not.toHaveBeenCalled();

			window.Hacked = null;
		});

	});

});
