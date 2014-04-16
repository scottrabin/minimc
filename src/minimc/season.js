"use strict";

var pad = require('../util/pad');

/**
 * Class encapsulating the Season data type
 *
 * @param {TVShow} parentShow
 * @param {Object} season
 */
function Season(parentShow, season) {
  this._parentShow = parentShow;
  this._src = season;
}

/**
 * Get the TV show this season is associated with
 *
 * @return {TVShow}
 */
Season.prototype.getTVShow = function() {
  return this._parentShow;
};

/**
 * Get the season number for this season
 *
 * @return {Number}
 */
Season.prototype.getSeason = function() {
  return this._src.season;
};

/**
 * Get the permalink for this season
 *
 * @return {String}
 */
Season.prototype.getPermalink = function() {
  return this.getTVShow().getPermalink() + "/S" + pad(this.getSeason(), 2);
};

/**
 * Get the poster artwork for the season
 *
 * @return {String}
 */
Season.prototype.getPosterArt = function() {
  return decodeURIComponent(this._src.art.poster.slice(8, -1));
};

/**
 * Parameters to fetch from XBMC
 * @const {Array}
 */
Season.XBMC_PROPERTIES = ['art', 'season'];

module.exports = Season;
