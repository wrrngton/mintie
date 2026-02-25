class Client {
  constructor(config) {
    this.config = config;
    this.rawDocStore = [];
    this.punctuationRegex = /[^a-zA-Z0-9 ]/g;
    this.invertedIndex = {};
  }

  init() {
    this.#processRawDocs();
    this.#createInvertedIndex();
    this.#createEventListeners();
  }

  search(e) {
    const queryTokens = this.#normaliseAndTokeniseQuery(e.target.value);
    const invertedIndexMatches = this.#getInvertedIndexMatches(queryTokens);
  }

  get rawDocs() {
    return this.rawDocStore;
  }

  get ii() {
    return this.invertedIndex;
  }

  #createEventListeners() {
    const searchBox = document.querySelector("#searchBox");
    searchBox.addEventListener("input", (e) => this.search(e));
  }

  #getInvertedIndexMatches(queryTokens) {
    let match = false;

    for (const token of queryTokens) {
        if (!this.invertedIndex.hasOwnProperty(token)) {
            match = false;
        }
        else match = true
    }

    if ( !match ) return;

    for (const token of queryTokens) {
      console.log(this.invertedIndex[token]);
    }
  }

  #normaliseAndTokeniseQuery(query) {
    const normalisedQuery = query
      .toLowerCase()
      .trim()
      .replace(this.punctuationRegex, "")
      .replaceAll("  ", " ");
    const normalisedQueryTokens = normalisedQuery.split(" ");
    return normalisedQueryTokens;
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
        } else {
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
