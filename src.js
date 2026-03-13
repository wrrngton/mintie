import { normalise } from "./normalise.js";
import { processRawDocs } from "./processDocs.js";
import { createInvertedIndex } from "./invertedIndex.js";
import { getInvertedIndexMatches } from "./query.js";
import { getRankedDocs } from "./ranking.js";
import { validateAndExportSettings } from "./settings.js";
import { getApiResponse } from "./apiResponse.js";
// import { createEventListeners } from "./listeners.js";

class Client {
  rawDocStore = [];
  invertedIndex = {};

  constructor(config) {
    const { userSettings, engineDefaults } = validateAndExportSettings(config);
    this.config = userSettings;
    this.engineDefaults = engineDefaults;
  }

  init() {
    this.rawDocStore = processRawDocs(this);
    this.invertedIndex = createInvertedIndex(this);
  }

  apiSearch(query) {
    const queryTokens = normalise(this, query, "search");
    const invertedIndexMatches = getInvertedIndexMatches(this, queryTokens);
    if (Object.keys(invertedIndexMatches).length === 0) {
      return [];
    }
    const rankedDocs = getRankedDocs(this, invertedIndexMatches);
    return rankedDocs;
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
