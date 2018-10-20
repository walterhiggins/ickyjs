let { gnf, update, map } = icky;
const qs = (sel, el) => (el ? el.querySelector(sel) : document.querySelector(sel));
const euc = encodeURIComponent;
const tc = dict => {
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

function searchByBandname(bandName) {
  bandName = encodeURIComponent(bandName.trim().toLowerCase());
  return musicBrainz.searchArtist(bandName, EXPIRES_DAY * 30).then(results => {
    let taggedArtists = results.artists.filter(byTaggedArtist);
    /*
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
*/
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

const albumsOnly = releaseGroup => {
  return releaseGroup["first-release-date"] && releaseGroup["primary-type"] == "Album";
};
const byReleaseDate = (a, b) => {
  if ("" + a["first-release-date"] > "" + b["first-release-date"]) {
    return 1;
  }
  if ("" + a["first-release-date"] == "" + b["first-release-date"]) {
    return 0;
  }
  return -1;
};
on("artist/releases", event => {
  let artist = event.detail.artist,
    releases = event.detail.releases;
  artist.releases = releases;
  update(`div[data-artist='${artist.id}']`, () => discography(artist));
});
const discography = artist => {
  if (!artist.releases) {
    return ``;
  }
  return `
<h3>Albums</h3>
<ol>
  ${map(
    artist.releases["release-groups"].filter(albumsOnly).sort(byReleaseDate),
    releaseGroup => `
  <li>
    <div class="album-title">${releaseGroup.title}</div>
    <div class="release-date">${releaseGroup["first-release-date"]}</div>
  </li>`
  )}
</ol>
  `;
};

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
  let getReleases = gnf(() => {
    musicBrainz.releasesByArtist(artist.id).then(releases => {
      publish(`artist/releases`, { artist, releases });
    });
  });
  return `
  <div class="artist">
    <h2>
      <a href="#/artist/${artist.id}/${artist.name}" onclick="${getReleases}()">
        <i class="fas fa-${artist.type == "Group" ? "users" : "user"}"></i> 
        ${artist.name}
      </a>
    </h2>
    <h3>
      ${begin} - ${end ? end : "&mdash;"} 
      ${beginArea ? beginArea : ""}
      ${artist.area ? ", " + artist.area.name : ""}
    </h3>
    ${tags.map(tag => `<span class="tag">${tag.name}</span>`)}
    <div class="discography" data-artist="${artist.id}">
      ${discography(artist)}
    </div>
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
