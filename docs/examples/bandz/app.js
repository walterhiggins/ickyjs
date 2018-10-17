let { gnf, update, map } = icky;
let qs = (sel, el) => (el ? el.querySelector(sel) : document.querySelector(sel));
let tc = dict => {
  Object.keys(dict).map(key => dict[key].forEach(el => el.classList.toggle(key)));
  return () => tc(dict);
};
// short-hand for subscribing to topics
const on = (...args) => {
  const callback = args.pop();
  args.forEach(topic => window.addEventListener(topic, callback));
};
const publish = (topic, data, el) => {
  let emitter = el ? el : document;
  let event = new CustomEvent(topic, { bubbles: true, detail: data });
  setTimeout(() => emitter.dispatchEvent(event), 0);
};

const dismissNotification = gnf(btn => {
  let notification = btn.parentNode;
  let container = notification.parentNode;
  container.removeChild(notification);
});
const cNotification = (msg, type) => `
<div class="notification ${type}">
  <button onclick="${dismissNotification}(this)" class="delete"></button>
  <span>${msg}</span>
</div>`;

const cInputSearch = (placeholder, promiseFn) => {
  let wrappedOnChange = gnf(input => {
    if (input.value.trim().length == 0) return;
    let loadingComplete = tc({
      "is-loading": [input.parentNode],
      "is-invisible": [qs("span.icon", input.parentNode)]
    });
    promiseFn(input.value)
      .then(loadingComplete)
      .catch(error => {
        loadingComplete();
        let errorEl = qs("div[data-type='error']", input.parentNode.parentNode);
        errorEl.innerHTML = cNotification(error, "is-danger");
      });
  });
  return `
<div class="field">
  <label class="label">${placeholder}</label>
  <div class="control has-icons-right">
    <input class="input"
           type="text"
           placeholder="${placeholder}"
           onchange="${wrappedOnChange}(this)"/>
    <span class="icon is-small is-right">
      <i class="fas fa-search"></i>
    </span>
  </div>
  <div data-type="error"></error>  
  </div>`;
};

const EXPIRES_DAY = 60 * 60 * 24;

/* nice fetch (fetch from localStorage if not stale) */
const niceFetch = (url, expires) => {
  function get() {
    return fetch(url)
      .then(response => response.json())
      .then(results => {
        const now = new Date().getTime();
        results.fetchTime = now;
        localStorage.setItem(url, JSON.stringify(results));
        return results;
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
    return new Promise(resolve => setTimeout(() => resolve(results), 0));
  }
};

function searchByBandname(bandName) {
  bandName = encodeURIComponent(bandName.trim().toLowerCase());
  return niceFetch(
    `https://musicbrainz.org/ws/2/artist?query=${bandName}&fmt=json`,
    EXPIRES_DAY * 30
  ).then(results => {
    let taggedArtists = results.artists.filter(byTaggedArtist);
    taggedArtists.forEach(artist => {
      niceFetch(
        `http://musicbrainz.org/ws/2/release?artist=${artist.id}&fmt=json`,
        EXPIRES_DAY * 30
      ).then(json => {
        console.log(json);
        let releases = json.releases.filter(release => {
          return (
            release["cover-art-archive"].count > 0 &&
            release["cover-art-archive"].front &&
            release.status == "Official"
          );
        });
        artist.releases = releases;
        releases.forEach(release => {
          niceFetch(
            `http://coverartarchive.org/release/${release.id}`,
            EXPIRES_DAY * 30
          ).then(coverArt => {
            let th250 = coverArt.images[0].thumbnails.small;
            release.thumbnail = th250;
            publish("artist/release/thumbnail", artist);
          });
        });
      });
    });
    update("#results", () => showBandResults(taggedArtists));
  });
}
function showBandResults(artists) {
  return `
  <ul>
    ${map(artists, artist => `<li>${showResult(artist)}</li>`)}
  </ul>`;
}
function byTaggedArtist(artist) {
  if (artist.tags) {
    let count = 0;
    artist.tags.forEach(tag => (count += tag.count));
    return count > 0;
  } else {
    return false;
  }
}
function showResult(artist) {
  let begin = artist["life-span"] ? artist["life-span"].begin : "";
  let end = artist["life-span"] ? artist["life-span"].end : "";
  let beginArea = artist["begin-area"] ? artist["begin-area"].name : "";
  let tags = [];
  const byCount = (a, b) => {
    return b.count - a.count;
  };
  if (artist.tags) {
    tags = artist.tags;
    tags = tags.sort(byCount).filter(tag => tag.count);
  }
  return `
  <div class="artist">
    <h2>
    <i class="fas fa-${artist.type == "Group" ? "users" : "user"}"></i> 
    ${artist.name}
    </h2>
    <h3>
      ${begin} - ${end ? end : "&mdash;"} 
      ${beginArea ? beginArea : ""}
      ${artist.area ? ", " + artist.area.name : ""}
  </h3>
    ${tags.map(tag => `<span class="tag">${tag.name}</span>`)}
  <div class="thumbnails" data-artist="${artist.id}"></div>
  </div>
  `;
}
const cThumbnails = artist => map(artist.releases, release => `<img src="${release.thumbnail}">`);
on("artist/release/thumbnail", event => {
  let artist = event.detail;
  update(`div[data-artist='${artist.id}']`, () => {
    return cThumbnails(artist);
  });
});

function searchBySong(bandName) {}
update(
  "#root",
  () => `
  <h1 class="title"><i class="fas fa-headphones"></i> Bandz</h1>
  <p>${cInputSearch("Search Band", searchByBandname)}</p>
  <p>${cInputSearch("Search Song", searchBySong)}</p>
  <div id="results"></div>`
);
