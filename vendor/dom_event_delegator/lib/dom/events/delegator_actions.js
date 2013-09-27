dom.events.DelegatorActions = function DelegatorActions() {
	this._map = {};
};

dom.events.DelegatorActions.prototype = {

	_map: null,

	add: function add(eventName, actionNames) {
		actionNames = actionNames instanceof Array ? actionNames : [actionNames];

		if (!this._map[eventName]) {
			this._map[eventName] = [];
		}

		this._map[eventName].push.apply(this._map[eventName], actionNames);
		return this;
	},

	blur: function blur(actionNames) {
		this.add("blur", actionNames);
		return this;
	},

	click: function click(actionNames) {
		this.add("click", actionNames);
		return this;
	},

	enterpress: function enterpress(actionNames) {
		this.add("enterpress", actionNames);
		return this;
	},

	domready: function domready(actionNames) {
		this.add("domready", actionNames);
		return this;
	},

	focus: function focus(actionNames) {
		this.add("focus", actionNames);
		return this;
	},

	focusin: function focusin(actionNames) {
		this.add("focus", actionNames);
		return this;
	},

	focusout: function focusin(actionNames) {
		this.add("focusout", actionNames);
		return this;
	},

	getMap: function getMap() {
		return this._map;
	},

	keydown: function keydown(actionNames) {
		this.add("keydown", actionNames);
		return this;
	},

	keypress: function keypress(actionNames) {
		this.add("keypress", actionNames);
		return this;
	},

	keyup: function keyup(actionNames) {
		this.add("keyup", actionNames);
		return this;
	},

	load: function load(actionNames) {
		this.add("load", actionNames);
		return this;
	},

	mousedown: function mousedown(actionNames) {
		this.add("mousedown", actionNames);
		return this;
	},

	mousein: function mousein(actionNames) {
		this.add("mousein", actionNames);
		return this;
	},

	mouseout: function mouseout(actionNames) {
		this.add("mouseout", actionNames);
		return this;
	},

	mousemove: function mousemove(actionNames) {
		this.add("mousemove", actionNames);
		return this;
	},

	mouseup: function mouseup(actionNames) {
		this.add("mouseup", actionNames);
		return this;
	},

	submit: function submit(actionNames) {
		this.add("submit", actionNames);
		return this;
	},

	toString: function toString() {
		return "[object Module.Actions]";
	},

	unload: function unload(actionNames) {
		this.add("unload", actionNames);
		return this;
	}

};
