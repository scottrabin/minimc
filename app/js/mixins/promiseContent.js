'use strict';

define(
[
	'js/spinner',
], function(spinner) {

	var EVENT_CONTENT_CHANGED = 'change.content';

	return promiseContent;

	/**
	 * Manages setting promise content into the correct node
	 */
	function promiseContent() {

		/**
		 * Sets the content of the given selector or node
		 * to the return value of the template applied
		 * against the return value of the promise
		 *
		 * @param {String|HTMLElement} selector The node to replace the contents of
		 * @param {Function(Object)} template The template function to use
		 * @param {Promise} promise The promise that will return the correct data for the template
		 * @return {Promise(HTMLElement, Object)} A promise for a node (or node set) with populated content
		 *											and the data used to generate the content
		 */
		this.setContent = function(selector, template, promise) {
			// get the correct node
			var node = (typeof selector === 'string' ? this.select(selector) : selector);

			// blank the content
			node.empty();

			return spinner.show(
				promise.then(function(templateData) {
					node.html( template(templateData) ).trigger(EVENT_CONTENT_CHANGED, templateData);
					// return the appropriate data
					return templateData;
				})
			);
		};

		/**
		 * Yields a promise for elements matching the selector after a given
		 * promise is fulfilled.
		 *
		 * @param {String} selector The selector attribute of the component
		 * @param {Promise} promise The promise to chain the selection to
		 * @return {Promise(HTMLElement, Object)} A promise for the selected elements and
		 *                                        the original promise value
		 */
		this.selectAfter = function(selector, promise) {
			var self = this;
			return promise.then(function(value) {
				return [self.select(selector), value];
			});
		};
	}
});
