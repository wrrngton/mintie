// Default search settings, overridden during Client.init() if present
export default settings = {
  docSelector: ".card",
  searchableAttributes: ["title", "description"],
  stopWords: ["a", "and", "the", "of", "for"],
  minCharsFor1Typo: 4,
  minCharsFor2Typos: 8,
  customRanking: [
    { attribute: "popularity", direction: 1 },
    { attribute: "price", direction: -1 },
  ],
  searchBarSelector: "#searchBar",
}
