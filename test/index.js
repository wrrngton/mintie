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
  customRanking: [
    { attribute: "popularity", direction: 1 },
    { attribute: "price", direction: -1 },
  ],
  searchBarSelector: "#searchBar",
};

const searchClient = new MinLia.SearchClient(config);
searchClient.init();

searchBar.addEventListener("input", (e) => {
  const query = e.target.value;

  if (query.length === 0) return hits.innerHTML = "";

  hits.innerHTML = '';
  const results = searchClient.apiSearch(e.target.value);
  
  if (results.length === 0) return hits.innerHTML = 'No results';

  const resultsHtml = results.map((result) => renderResults(result)).join('');
  hits.insertAdjacentHTML('afterbegin', resultsHtml);
});
