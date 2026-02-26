const hits = document.querySelector('#hits');
const searchBar = document.querySelector('#searchBox');

function renderResults(result) {
  return `
  <div>
    ${result.title}
    ${result.description}
  </div>
  `
}

const config = {
  docSelector: ".card",
  searchableAttributes: ["title", "description"],
  stopWords: ["a", "and", "the", "of", "for"],
  customRanking: [
    { attribute: "popularity", direction: 1 },
    { attribute: "price", direction: -1 },
  ],
  searchBarSelector: "#searchBar",
};

const searchClient = new MinLia.SearchClient(config);
searchClient.init();

searchBar.addEventListener("input", (e) => {
  const results = searchClient.apiSearch(e.target.value);
  const resultsHtml = results.map((result) => renderResults(result)).join('');
  hits.insertAdjacentHTML('afterbegin', resultsHtml);
});
