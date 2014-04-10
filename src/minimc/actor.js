"use strict";

/**
 * Class encapsulating the Actor data type
 *
 * @param {Object} actor
 */
function Actor(actor) {
  this._src = actor;
};

/**
 * Get the actor's name
 *
 * @return {String}
 */
Actor.prototype.getName = function() {
  return this._src.name;
};

/**
 * Get the actor's role in the episode or movie
 *
 * @return {String}
 */
Actor.prototype.getRole = function() {
  return this._src.role;
};

/**
 * Get URI of the actor's portrait
 *
 * @return {String}
 */
Actor.prototype.getPortrait = function() {
  return (this._src.thumbnail ? decodeURIComponent(this._src.thumbnail.slice(8, -1)) : null);
};

/**
 * Convenience wrapper to create Actor instances
 *
 * @param {Object} source
 * @return {Actor}
 */
Actor.create = function(source) {
  return new Actor(source);
};

module.exports = Actor;
