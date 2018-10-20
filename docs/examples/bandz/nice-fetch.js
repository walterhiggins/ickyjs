(function(exports) {
  "use strict";
  /* nice fetch (fetch from localStorage if not stale) */
  const niceFetch = (url, expires) => {
    function get() {
      return fetch(url)
        .then(response => response.text())
        .then(text => {
          const fetchTime = new Date().getTime();
          localStorage.setItem(url, JSON.stringify({ fetchTime, text }));
          return text;
        });
    }
    let results = localStorage.getItem(url);
    if (!results) {
      return get();
    }
    results = JSON.parse(results);
    const now = new Date().getTime();
    const fetched = results.fetchTime;
    if (now - fetched > expires * 1000) {
      // results are stale
      return get();
    } else {
      return new Promise(resolve => setTimeout(() => resolve(results.text), 0));
    }
  };
  exports.niceFetch = niceFetch;
})(window);
