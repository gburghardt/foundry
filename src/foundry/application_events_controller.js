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