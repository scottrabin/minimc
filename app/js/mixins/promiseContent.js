'use strict';

define(
[
	'js/spinner',
], function(spinner) {

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
					// return the appropriate data
					return [node.html( template(templateData) ), templateData];
				})
			);
		};
	}
});
