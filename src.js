import { normalise } from "./normalise.js";
import { processRawDocs } from "./processDocs.js";
import { createInvertedIndex } from "./ii.js";
import { getInvertedIndexMatches } from "./query.js";
import { getRankedDocs } from "./ranking.js";
import { createEventListeners } from "./listeners.js";

class Client {
  rawDocStore = [];
  invertedIndex = {};

  constructor(config) {
    this.config = config;
  }

  init() {
    this.rawDocStore = processRawDocs(this);
    this.invertedIndex = createInvertedIndex(this);
    // createEventListeners(this);
  }

  apiSearch(query) {
    const queryTokens = normalise(this, query);
    const invertedIndexMatches = getInvertedIndexMatches(this, queryTokens);
    if (invertedIndexMatches.length === 0) {
      return [];
    }
    return getRankedDocs(this, invertedIndexMatches);
  }

  // search(e) {
  //   const queryTokens = normalise(this, e.target.value);
  //   const invertedIndexMatches = getInvertedIndexMatches(this, queryTokens);
  //   if (invertedIndexMatches.length === 0) {
  //     return [];
  //   }
  //   return getRankedDocs(this, invertedIndexMatches);
  // }
}

window.MinLia = {
  SearchClient: Client,
};
