"use strict";

module.exports = function EpisodeFactory(Actor, artworkFilter, padFilter) {
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
   * Get the season/episode qualifier
   *
   * @return {String}
   */
  Episode.prototype.getQualifiedIdentity = function() {
    return "S" + padFilter(this.getSeason(), 2) + "E" + padFilter(this.getEpisode(), 2);
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
   * Get the plot for this episode
   *
   * @return {String}
   */
  Episode.prototype.getPlot = function() {
    return this._src.plot;
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
   * Get the list of cast members
   *
   * @return {Array<Actor>}
   */
  Episode.prototype.getCast = function() {
    if (!this._cast) {
      this._cast = this._src.cast.map(Actor.create);
    }
    return this._cast;
  };

  /**
   * Get the permalink for this episode
   *
   * @return {String}
   */
  Episode.prototype.getPermalink = function() {
    return this.getTVShow().getPermalink() + "/" + this.getQualifiedIdentity();
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
  Episode.XBMC_PROPERTIES = ['art', 'season', 'episode', 'title', 'plot', 'cast',
                             'firstaired'];

  return Episode;
};

module.exports.$inject = ['Actor', 'artworkFilter', 'padFilter'];
