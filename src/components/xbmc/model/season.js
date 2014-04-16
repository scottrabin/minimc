"use strict";

module.exports = function SeasonFactory(artworkFilter, padFilter) {
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
    return this.getTVShow().getPermalink() + "/S" + padFilter(this.getSeason(), 2);
  };

  /**
   * Get the poster artwork for the season
   *
   * @return {String}
   */
  Season.prototype.getPosterArt = function() {
    return artworkFilter(this._src.art.poster);
  };

  /**
   * Parameters to fetch from XBMC
   * @const {Array}
   */
  Season.XBMC_PROPERTIES = ['art', 'season'];

  return Season;
};

module.exports.$inject = ['artworkFilter', 'padFilter'];
