import { normalise } from "./utils/normalise.js";
import { processRawDocs } from "./core/processDocs.js";
import { createInvertedIndex } from "./core/invertedIndex.js";
import { getInvertedIndexMatches } from "./core/query.js";
import { getRankedDocs } from "./core/ranking.js";
import { validateAndExportSettings } from "./validators/settings.js";
import { GenerateResponse } from "./api/apiResponse.js";

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

    // GenerateResponse
    const response = new GenerateResponse(this, rankedDocs);
    return response;
  }
}

window.MinLia = {
  SearchClient: Client,
};
