"use strict";

module.exports = function EpisodeFactory(artworkFilter, padFilter) {
  /**
   * Class encapsulating the Episode data type
   *
   * @param {TVShow} parentShow
   * @param {Object} episode
   */
  function Episode(parentShow, episode) {
    this._parentShow = parentShow;
    this._src = episode;
  }

  /**
   * Get the TV show this episode is associated with
   *
   * @return {TVShow}
   */
  Episode.prototype.getTVShow = function() {
    return this._parentShow;
  };

  /**
   * Get the season number for this episode
   *
   * @return {Number}
   */
  Episode.prototype.getSeason = function() {
    return this._src.season;
  };

  /**
   * Get the episode number for this episode
   *
   * @return {Number}
   */
  Episode.prototype.getEpisode = function() {
    return this._src.episode;
  };

  /**
   * Get the title for this episode
   *
   * @return {String}
   */
  Episode.prototype.getTitle = function() {
    return this._src.title;
  };

  /**
   * Get the original air date for this episode
   *
   * @return {Date}
   */
  Episode.prototype.getAirDate = function() {
    return new Date(this._src.firstaired);
  };

  /**
   * Get the permalink for this episode
   *
   * @return {String}
   */
  Episode.prototype.getPermalink = function() {
    return this.getTVShow().getPermalink() + "/S" + padFilter(this.getSeason(), 2) + "E" + padFilter(this.getEpisode(), 2);
  };

  /**
   * Get the poster artwork for the episode
   *
   * @return {String}
   */
  Episode.prototype.getThumbnailArt = function() {
    return artworkFilter(this._src.art.thumb);
  };

  // convenience function to create instances of this class
  Episode.create = function(tvshow, episode) {
    return new Episode(tvshow, episode);
  };

  /**
   * Parameters to fetch from XBMC
   * @const {Array}
   */
  Episode.XBMC_PROPERTIES = ['art', 'season', 'episode', 'title', 'firstaired'];

  return Episode;
};

module.exports.$inject = ['artworkFilter', 'padFilter'];
