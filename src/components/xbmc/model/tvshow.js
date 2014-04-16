"use strict";

module.exports = function TVShowFactory(Actor, artworkFilter, slugFilter) {

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
    return artworkFilter(this._src.art.banner);
  };

  /**
   * Get the src for the poster art of the TV show
   *
   * @return {String}
   */
  TVShow.prototype.getPoster = function() {
    return artworkFilter(this._src.art.poster);
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
    return slugFilter(this.getTitle());
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

  /**
   * Parameters to fetch from XBMC
   * @const {Array}
   */
  TVShow.XBMC_PROPERTIES = ['tvshowid', 'art', 'title', 'cast'];

  // expose class
  return TVShow;
};

module.exports.$inject = ['Actor', 'artworkFilter', 'slugFilter'];
