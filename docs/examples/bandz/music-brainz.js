(function(exports) {
  const API = "https://musicbrainz.org/ws/2";
  const fromXML = text => new window.DOMParser().parseFromString(text, "text/xml");
  const fromJSON = text => JSON.parse(text);

  const releasesByArtist = (artistId, expires) =>
    niceFetch(`${API}/release-group?artist=${artistId}&limit=100&fmt=json`, expires).then(fromJSON);

  const searchArtist = (name, expires) =>
    niceFetch(`${API}/artist?query=${name}&fmt=json`, expires).then(fromJSON);

  exports.musicBrainz = {
    releasesByArtist,
    searchArtist
  };
})(window);
