import { normalise } from "./utils/normalise.js";
import { processRawDocs } from "./core/processDocs.js";
import { createInvertedIndex } from "./core/invertedIndex.js";
import { getInvertedIndexMatches } from "./core/query.js";
import { filtering } from "./core/filtering.js";
import { getFacets } from "./core/queryFacets.js";
import { getRankedDocs } from "./core/ranking.js";
import { validateAndExportSettings } from "./validators/settings.js";
import { validatePayload } from "./validators/payload.js";
import { GenerateResponse } from "./api/apiResponse.js";
// import { createEventListeners } from "./listeners.js";

class Client {
  rawDocStore = [];
  invertedIndex = {};
  payload = null;

  constructor(config) {
    const { userSettings, engineDefaults } = validateAndExportSettings(config);
    this.config = userSettings;
    this.engineDefaults = engineDefaults;
    this.rawDocStore = processRawDocs(this);
    this.invertedIndex = createInvertedIndex(this);
  }

  filterResults(rankedDocs = null) {
    const filteredResults = filtering(this, rankedDocs); 
    return filteredResults;
  }

  apiSearch(query, payload = null) {
    // Payload
    this.payload = payload !== null ? payload : null;
    validatePayload(this);

    // Tokenize query
    const queryTokens = normalise(this, query, "search");

    // Get invertedIndex matches
    const invertedIndexMatches = getInvertedIndexMatches(this, queryTokens);
    if (Object.keys(invertedIndexMatches).length === 0) {
      const response = new GenerateResponse(this, [], []);
      return response;
    }

    // Get ranked docs
    const rankedDocs = getRankedDocs(this, invertedIndexMatches);

    // Filter ranked docs
    const filteredResults = this.filterResults(this, rankedDocs);

    // Get query facets
    const facetsForQuery = getFacets(this, rankedDocs);

    // GenerateResponse
    const response = new GenerateResponse(this, rankedDocs, facetsForQuery);
    return response;
  }
}

window.MinLia = {
  SearchClient: Client,
};
