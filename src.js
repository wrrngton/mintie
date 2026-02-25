// const documents = [
//   { id: 1, name: "Classic Toaster", typo: 0,  popularity: 100, price: 20 },
//   { id: 2, name: "Modern Toaster", typo: 0,  popularity: 100, price: 15 },
//   { id: 3, name: "Basic Toaster", typo: 1,  popularity: 50,  price: 10 },
//   { id: 4, name: "Deluxe Toaster", typo: 1,  popularity: 150, price: 50 },
// ];

// const rankedResults = documents.sort((a, b) => {
//
//   if (b.typo !== a.typo) {
//     return b.typo + a.typo;
//   }
//
//   else if (b.popularity !== a.popularity) {
//     return b.popularity - a.popularity;
//   }
//
//   return a.price + b.price;
// });
//
// console.table(rankedResults);
//

class Client {
  constructor(config) {
    this.config = config;
    this.rawDocStore = [];
    this.punctuationRegex = /[\.,'"?!]/g;
    this.invertedIndex = {};
  }

  init() {
    this.#processRawDocs();
    this.#createInvertedIndex();
  }

  async search(query) {
    console.log(query);
  }

  get rawDocs() {
    return this.rawDocStore;
  }

  get ii() {
    return this.invertedIndex;
  }

  #processRawDocs() {
    const rawDocuments = Array.from(
      document.querySelectorAll(this.config.docSelector),
    );
    const rawDocumentsData = rawDocuments.map((doc) => {
      let rawDocObj = {};
      rawDocObj.objectid = doc.dataset.objectid;
      for (const att of this.config.searchableAttributes) {
        rawDocObj[att] = doc.dataset[att];
      }
      return rawDocObj;
    });
    this.rawDocStore = rawDocumentsData;
  }

  #createInvertedIndex() {
    const invertedIndex = {};

    for (const doc of this.rawDocStore) {
      const docTokens = [];

      for (const [key, value] of Object.entries(doc)) {
        if (key == "objectid") continue;

        const splitVals = value
          .toLowerCase()
          .trim()
          .replace(this.punctuationRegex, "")
          .split(" ");
        splitVals.forEach((token) => {
          if (this.config.stopWords.includes(token)) return;
          docTokens.push(token);
        });
      }

      const docTokensSet = new Set(docTokens);
      const uniqueDocTokens = [...docTokensSet];

      for (const token of uniqueDocTokens) {
        if (invertedIndex.hasOwnProperty(token)) {
          invertedIndex[token].push(doc.objectid);
        } 
        else {
          invertedIndex[token] = [doc.objectid];
        }
      }
    }
    this.invertedIndex = invertedIndex;
  }
}

window.MinLia = {
  SearchClient: Client,
};
