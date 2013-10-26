var ShowDateModule = Module.Base.extend({

	prototype: {

		_ready: function _ready() {
			this.element.innerHTML = [
				'<div class="module-body">',
					'<p>Like a long, lost love, I\'ve been waiting for you. *sniff*</p>',
					'<p>Finally you arrived!</p>',
				'</div>'
			].join("");
		}

	}

});
