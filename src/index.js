import { normalise } from "./utils/normalise.js";
import { processRawDocs } from "./core/processDocs.js";
import { createInvertedIndex } from "./core/invertedIndex.js";
import { getInvertedIndexMatches } from "./core/query.js";
import { getFacets } from "./core/queryFacets.js";
import { getRankedDocs } from "./core/ranking.js";
import { validateAndExportSettings } from "./settings.js";
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
  
  getQueryFacets(docIDs, facetNames) {
    getFacets(this, docIDs, facetNames);
  }

  apiSearch(query) {
    const queryTokens = normalise(this, query, "search");
    const invertedIndexMatches = getInvertedIndexMatches(this, queryTokens);
    if (Object.keys(invertedIndexMatches).length === 0) {
      return [];
    }
    const rankedDocs = getRankedDocs(this, invertedIndexMatches);
    const rankedDocsIDs = rankedDocs.map((doc) => doc.objectid);
    const facetsForQuery = this.getQueryFacets(rankedDocsIDs, ["category"]);
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
