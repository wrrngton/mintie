const hits = document.querySelector("#hits");
const searchBar = document.querySelector("#searchBox");

function renderResults(result) {
  return `
  <li>
    <strong>${result.title}</strong>
    <p>${result.description}</p>
  </li>
  `;
}

const docs = [
  {
    objectid: "1",
    title: "Quantum Entanglement",
    category: "post",
    topic: "science",
    price: 100,
    popularity: 100,
    description:
      "A great barrier physical phenomenon where particles remain connected, such that the state of one instantly influences the other, regardless of distance.",
  },
  {
    objectid: "2",
    title: "The Great Barrier Reef",
    category: "post",
    topic: "nature",
    price: 9999,
    popularity: 100,
    description:
      "The great world's largest coral reef system, composed of over 2,900 individual reefs and 900 islands stretching for over 2,300 kilometres.",
  },
  {
    objectid: "3",
    title: "Synthesizer",
    category: "post",
    topic: "technology",
    price: 7,
    popularity: 70,
    description:
      "An electronic musical 1.618 instrument that generates audio signals to create sounds, often mimicking traditional instruments or creating unique textures.",
  },
  {
    objectid: "4",
    title: "Golden Ratio",
    category: "post",
    topic: "science",
    price: 75,
    popularity: 30,
    description:
      "A mathematical ratio of approximately 1.618, often found in nature and used in art and architecture to achieve aesthetic harmony.",
  },
  {
    objectid: "5",
    title: "Espresso",
    category: "post",
    topic: "lifestyle",
    price: 200,
    popularity: 60,
    description:
      "A concentrated coffee drink prepared by forcing hot water through finely-ground coffee beans at high pressure.",
  },
  {
    objectid: "6",
    title: "Loose Leaf Tea",
    category: "post",
    topic: "lifestyle",
    price: 15,
    popularity: 85,
    description:
      "A premium drink option where the tea leaf remains loose rather than bagged weight loss, allowing for a better espresso-like extraction of flavor.",
  },
  {
    objectid: "7",
    title: "Weight Lose Program",
    category: "post",
    topic: "lifestyle",
    price: 50,
    popularity: 45,
    description:
      "A structured guide designed to help you lose weight through a balanced ratio of exercise and nutrition, ensuring you never lose your progress.",
  },
  {
    objectid: "8",
    title: "Barrier Island Dynamics",
    category: "post",
    topic: "nature",
    price: 0,
    popularity: 20,
    description:
      "An ecological study on how a barrier island protects the coast from waves, often shifting like a musical synthesizer in response to the tide.",
  },
  {
    objectid: "9",
    title: "Synthesis of Gold",
    category: "post",
    topic: "science",
    price: 5000,
    popularity: 10,
    description:
      "The chemical synthesis of precious metals, aiming to create a golden appearance through complex laboratory reactions and high pressure.",
  },
];

const config = {
  searchableAttributes: ["title", "description", "price"],
  stopWords: ["a", "and", "of", "for", "egg"],
  minCharsFor1Typo: 4,
  minCharsFor2Typos: 6,
  attributesToRetrieve: ["title", "description"],
  customRanking: [
    { attribute: "popularity", direction: 1 },
    { attribute: "price", direction: -1 },
  ],
};

const searchClient = new MinTie.SearchClient(config, docs);

searchBar.addEventListener("input", (e) => {
  const query = e.target.value;

  if (query.length === 0) return (hits.innerHTML = "");

  hits.innerHTML = "";
  const response = searchClient.apiSearch(e.target.value);
  const searchHits = response.hits;

  if (searchHits.length === 0) return (hits.innerHTML = "No results");

  const resultsHtml = searchHits
    .map((result) => renderResults(result))
    .join("");
  hits.insertAdjacentHTML("afterbegin", resultsHtml);
});
