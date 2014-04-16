"use strict";

module.exports = function ActorFactory(artworkFilter) {
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
    return artworkFilter(this._src.thumbnail);
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

  return Actor;
};

module.exports.$inject = ['artworkFilter'];
