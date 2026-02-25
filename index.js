const config = {
  docSelector: '.card',
  searchableAttributes: ['title', 'description'],
  stopWords: ['a', 'and', 'the', 'of', 'for'],
  searchBarSelector: '#searchBar'
}

const searchClient = new MinLia.SearchClient(config);
searchClient.init();
