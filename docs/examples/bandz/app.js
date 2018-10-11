//fetch("https://musicbrainz.org/ws/2/artist?query=The%20Stone%20Roses&fmt=json")
//    .then(response => response.json())
//    .then(
let { gnf, update } = icky;

const tSearch = (placeholder, callback) => `
  <span class="search">
    <input placeholder="${placeholder}"
           onchange="${gnf(callback)}(this.value)">
    <i class="fas fa-search"></i>
  </span>`;

function searchByBandname(bandName) {
  console.log("Band: " + bandName);
}
function searchBySong(bandName) {
  console.log("Song: " + bandName);
}
update(
  "#root",
  () => `
  <h1><i class="fas fa-headphones"></i>Bandz</h1>
  <p>${tSearch("Search Band", searchByBandname)}</p>
  <p>${tSearch("Search Song", searchBySong)}</p>
  `
);
