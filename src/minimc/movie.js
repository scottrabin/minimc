"use strict";

var toSlug = require('../util/slug');
var Actor = require('./actor');

/**
 * Class encapsulating the Movie data type
 *
 * @param {Object} movie
 */
function Movie(movie) {
  this._src = movie;
};

/**
 * Get the title of the movie
 *
 * @return {String}
 */
Movie.prototype.getTitle = function() {
  return this._src.title;
};

/**
 * Get the src for the poster art of the movie
 *
 * @return {String}
 */
Movie.prototype.getPoster = function() {
  return decodeURIComponent(this._src.art.poster.slice(8, -1));
};

/**
 * Get the list of cast members
 *
 * @return {Array<Actor>}
 */
Movie.prototype.getCast = function() {
  if (!this._cast) {
    this._cast = this._src.cast.map(Actor.create);
  }
  return this._cast;
};

/**
 * Get the slug identifying this movie
 *
 * @return {String}
 */
Movie.prototype.getSlug = function() {
  return toSlug(this.getTitle());
};

/**
 * Get the permalink to this movie
 *
 * @return {String}
 */
Movie.prototype.getPermalink = function() {
  return "#/movies/" + this.getSlug();
};

// convenience function to create instances of this class
Movie.create = function(movie) {
  return new Movie(movie);
};

// expose class
module.exports = Movie;
