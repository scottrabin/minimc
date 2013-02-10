'use strict';

define([
], function() {

	var EVENT_MAIN_VIEW_HIDE_OTHERS = 'mainView:hideOthers';

	return mainView;

	/**
	 * Generalized mixin for handling the swap between primary
	 * page view components
	 *
	 * Requires:
	 * @param {Function} show A function to manage showing the element
	 * @param {Function} hide A function to manage hiding the element
	 * 
	 * Exports:
	 * {Function(node?, string)} Register an event as activating this primary view component
	 */
	function mainView() {

		/**
		 * Deferral functions for triggering events
		 * @private
		 */
		function triggerShow(data) { this.trigger('show', data); };
		function triggerHide() { this.trigger('hide'); };

		/**
		 * Show/hide functions
		 * @private
		 */
		function show() { this.$node.show(); };
		function hide() { this.$node.hide(); };

		/**
		 * Switch the active view to the given component
		 * @private
		 */
		function switchActiveView(event, data) {
			// temporarily ignore calls to hide other main view components
			this.off(document, EVENT_MAIN_VIEW_HIDE_OTHERS, triggerHide);
			this.trigger(document, EVENT_MAIN_VIEW_HIDE_OTHERS);
			this.on(document, EVENT_MAIN_VIEW_HIDE_OTHERS, triggerHide);
			triggerShow.call(this, data);
		};

		/**
		 * Register a component as a primary view component that activates
		 * on a specific event. Handles internal management of hiding other
		 * primary view components.
		 *
		 * @param {HTMLElement=} elem Element source for the event. Default to this.$node
		 * @param {String} eventName The event name[s] to listen for
		 */
		this.activateOn = function(elem, eventName) {
			if (arguments.length === 1) {
				eventName = elem;
				elem = this.$node;
			}
			this.on(elem, eventName, switchActiveView);
		};

		/**
		 * Register the hide event for this component
		 */
		this.after('initialize', function() {
			this.on(document, EVENT_MAIN_VIEW_HIDE_OTHERS, triggerHide);
			this.on('show', show);
			this.on('hide', hide);
		});
	}

});
