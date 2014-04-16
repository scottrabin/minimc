"use strict";

var toSlug = require('../util/slug');
var Actor = require('./actor');

/**
 * Class encapsulating the TV Show data type
 *
 * @param {Object} tvshow
 */
function TVShow(tvshow) {
  this._src = tvshow;
}

/**
 * Get the unique identifier for the TV show
 *
 * @return {Number}
 */
TVShow.prototype.getId = function() {
  return this._src.tvshowid;
};

/**
 * Get the title of the TV show
 *
 * @return {String}
 */
TVShow.prototype.getTitle = function() {
  return this._src.title;
};

/**
 * Get the src for the banner art of the TV show
 *
 * @return {String}
 */
TVShow.prototype.getBannerArt = function() {
  return decodeURIComponent(this._src.art.banner.slice(8, -1));
};

/**
 * Get the src for the poster art of the TV show
 *
 * @return {String}
 */
TVShow.prototype.getPoster = function() {
  return decodeURIComponent(this._src.art.poster.slice(8, -1));
};

/**
 * Get the list of cast members
 *
 * @return {Array<Actor>}
 */
TVShow.prototype.getCast = function() {
  if (!this._cast) {
    this._cast = this._src.cast.map(Actor.create);
  }
  return this._cast;
};

/**
 * Get the slug identifying this TV show
 *
 * @return {String}
 */
TVShow.prototype.getSlug = function() {
  return toSlug(this.getTitle());
};

/**
 * Get the permalink to this TV show
 *
 * @return {String}
 */
TVShow.prototype.getPermalink = function() {
  return "#/tv-shows/" + this.getSlug();
};

// convenience function to create instances of this class
TVShow.create = function(tvshow) {
  return new TVShow(tvshow);
};

// expose class
module.exports = TVShow;
