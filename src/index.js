/**
 * @fileoverview Main entry point for the MinLia search engine client.
 * @module minlia
 */

import { normalise } from "./utils/normalise.js";
import { processRawDocs } from "./core/processDocs.js";
import { createInvertedIndex } from "./core/invertedIndex.js";
import { getInvertedIndexMatches } from "./core/query.js";
import { getRankedDocs } from "./core/ranking.js";
import { validateAndExportSettings } from "./validators/settings.js";
import { GenerateResponse } from "./api/apiResponse.js";

/**
 * The main search client for MinLia.
 * Provides full-text search capabilities with typo tolerance and custom ranking.
 * @class
 * @example
 * const client = new MinLia.SearchClient({
 *   docSelector: ".product-card",
 *   searchableAttributes: ["title", "description"],
 *   customRanking: [{ attribute: "popularity", direction: 1 }]
 * });
 * client.init();
 * const results = client.apiSearch("laptop");
 */
class Client {
  /**
   * Storage for raw document data extracted from the DOM.
   * @type {Array<Object>}
   */
  rawDocStore = [];

  /**
   * The inverted index mapping tokens to document IDs.
   * @type {Object<string, Array<string>>}
   */
  invertedIndex = {};

  /**
   * Creates a new MinLia search client instance.
   * @param {Object} config - Configuration options for the search client.
   * @param {string} config.docSelector - CSS selector for document elements.
   * @param {Array<string>} config.searchableAttributes - Attributes to index for searching.
   * @param {Array<string>} [config.stopWords] - Words to exclude from indexing.
   * @param {Array<string>} [config.attributesToRetrieve] - Attributes to include in results.
   * @param {number} [config.minCharsFor1Typo=4] - Minimum characters before allowing 1 typo.
   * @param {number} [config.minCharsFor2Typos=6] - Minimum characters before allowing 2 typos.
   * @param {Array<Object>} [config.customRanking] - Custom ranking rules.
   * @param {string} [config.searchBarSelector] - CSS selector for the search input.
   * @throws {ConfigError} If configuration is invalid.
   */
  constructor(config) {
    const { userSettings, engineDefaults } = validateAndExportSettings(config);
    this.config = userSettings;
    this.engineDefaults = engineDefaults;
  }

  /**
   * Initializes the search engine by processing documents and building the inverted index.
   * Must be called after construction and before performing searches.
   * @returns {void}
   */
  init() {
    this.rawDocStore = processRawDocs(this);
    this.invertedIndex = createInvertedIndex(this);
  }

  /**
   * Performs a search query and returns ranked results.
   * @param {string} query - The search query string.
   * @returns {Object} The search response object.
   * @returns {Array<Object>} return.hits - Array of matching documents.
   */
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

window.MinTie = {
  SearchClient: Client,
};
