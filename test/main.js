const hits = document.querySelector('#hits');
const searchBar = document.querySelector('#searchBox');

function renderResults(result) {
  return `
  <li>
    <strong>${result.title}</strong>
    <p>${result.description}</p>
  </li>
  `
};

const config = {
  docSelector: ".card",
  searchableAttributes: ["title", "description"],
  stopWords: ["a", "and", "of", "for", "egg"],
  minCharsFor1Typo: 4,
  minCharsFor2Typos: 6,
  facets: ["category", "topic"],
  attributesToRetrieve: ["title", "description"],
  customRanking: [
    { attribute: "popularity", direction: 1 },
    { attribute: "price", direction: -1 },
  ],
  searchBarSelector: "#searchBar",
};

const searchClient = new MinLia.SearchClient(config);

searchBar.addEventListener("input", (e) => {
  const query = e.target.value;

  if (query.length === 0) return hits.innerHTML = "";

  hits.innerHTML = '';
  const response = searchClient.apiSearch(e.target.value);
  const searchHits = response.hits;
  
  if (searchHits.length === 0) return hits.innerHTML = 'No results';

  const resultsHtml = searchHits.map((result) => renderResults(result)).join('');
  hits.insertAdjacentHTML('afterbegin', resultsHtml);
});
