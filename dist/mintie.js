(() => {
  // src/utils/normalise.js
  var punctuationRegex = /[^a-zA-Z0-9 ]/g;
  function normalise(instance, term, type) {
    const masterTokens = [];
    const splitVals = term.toString().toLowerCase().trim().replace(punctuationRegex, "").split(" ");
    if (type === "search") {
      return splitVals;
    }
    for (const singleTerm of splitVals) {
      const smallTokens = [];
      const singleTokensSplit = singleTerm.split("");
      for (const tok in singleTokensSplit) {
        if (smallTokens.length === 0) {
          smallTokens.push(singleTokensSplit[tok]);
        } else {
          const minusOneToken = tok - 1;
          const fString = `${smallTokens[minusOneToken]}${singleTokensSplit[tok]}`;
          smallTokens.push(fString);
        }
      }
      masterTokens.push(smallTokens);
    }
    const combinedArrays = masterTokens.reduce(
      (accumulator, currentVal) => currentVal.concat(accumulator)
    );
    return combinedArrays;
  }

  // src/utils/error.js
  var ConfigError = class extends Error {
    /**
     * Creates a new ConfigError.
     * @param {string} errorMessage - The error message describing the configuration problem.
     */
    constructor(errorMessage) {
      super(errorMessage);
      this.name = "ConfigError";
    }
  };

  // src/core/processDocs.js
  function processRawDocs(docs) {
    const typeHashMap = {};
    if (typeof docs !== "object" || docs == null) {
      throw new ConfigError("Supplied documents are not objects or is null");
    }
    for (const doc of docs) {
      const objectid = doc.objectid;
      if (objectid == void 0) {
        throw new ConfigError("All docs must have an objectid field");
      }
      if (typeof objectid !== "string") {
        throw new ConfigError("Objectids must all be strings");
      }
      for (const [key, value] of Object.entries(doc)) {
        if (typeHashMap.hasOwnProperty(key)) typeHashMap[key].push(typeof value);
        else typeHashMap[key] = [typeof value];
      }
    }
    for (const [key, value] of Object.entries(typeHashMap)) {
      const uniqueArr = [...new Set(value)];
      if (uniqueArr.length > 1)
        throw new ConfigError(
          `Your documents cannot have mixed types per attribute. Different data types detectes for ${key}.`
        );
    }
    return docs;
  }

  // src/core/invertedIndex.js
  function createInvertedIndex(instance) {
    const invertedIndex = {};
    for (const doc of instance.rawDocStore) {
      const docTokens = [];
      for (const [key, value] of Object.entries(doc)) {
        if (key == "objectid" || !instance.config.searchableAttributes.includes(key)) continue;
        const attributeTokens = normalise(instance, value, "docs");
        attributeTokens.forEach((token) => {
          if (instance.config.stopWords.includes(token)) return;
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
    return invertedIndex;
  }

  // src/utils/levenschtein.js
  function getLevenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // src/core/query.js
  function matchIsNotTooFuzzy(instance, term, token, acceptableNumTypos2) {
    const distance = getLevenshteinDistance(token, term);
    if (distance > acceptableNumTypos2) {
      return [];
    }
    return {
      docs: instance.invertedIndex[term],
      distance,
      // Query term tracks the matching intervered index term for later snippeting and highlighting
      queryTerm: [token]
    };
  }
  function getInvertedIndexMatches(instance, queryTokens) {
    const iiMatches = [];
    const invertedIndexTerms = Object.keys(instance.invertedIndex);
    for (const token of queryTokens) {
      const tokenLength = token.length;
      if (tokenLength <= instance.engineDefaults.disableTypoToleranceBeforeQueryLength) {
        if (invertedIndexTerms.includes(token)) {
          iiMatches.push([
            {
              docs: instance.invertedIndex[token],
              distance: 0,
              queryTerm: [token]
            }
          ]);
        }
      } else {
        if (tokenLength > instance.engineDefaults.disableTypoToleranceBeforeQueryLength && tokenLength >= instance.config.minCharsFor1Typo && tokenLength < instance.config.minCharsFor2Typos) {
          acceptableNumTypos = 1;
        } else if (tokenLength >= instance.config.minCharsFor2Typos) {
          acceptableNumTypos = 2;
        } else {
          acceptableNumTypos = 0;
        }
        const invertedIndexTermsFuzzyMatched = invertedIndexTerms.flatMap(
          (term) => matchIsNotTooFuzzy(instance, term, token, acceptableNumTypos)
        );
        iiMatches.push(invertedIndexTermsFuzzyMatched);
      }
    }
    if (iiMatches.length === 0) return {};
    const finalMatchedDocs = {};
    if (iiMatches.length === 1) {
      const matchedArray = iiMatches[0];
      for (let i = 0; i < matchedArray.length; i++) {
        const docsArr = matchedArray[i].docs;
        const token = matchedArray[i].queryTerm;
        const docDistance = matchedArray[i].distance;
        for (let j = 0; j < docsArr.length; j++) {
          const docID = docsArr[j];
          if (finalMatchedDocs.hasOwnProperty(docID) && finalMatchedDocs[docID] < docDistance) {
            continue;
          } else {
            finalMatchedDocs[docID] = {
              distance: docDistance,
              queryTerm: token
            };
          }
        }
      }
      return finalMatchedDocs;
    }
    const docsAsMatrix = iiMatches.map((match) => {
      const new_arr = [];
      for (const f of match) {
        new_arr.push(...f.docs);
      }
      return Array.from(new Set(new_arr));
    });
    const intersectArrays = (arrays) => {
      return arrays.reduce((acc, currentArray) => {
        const currentSet = new Set(currentArray);
        return acc.filter((item) => currentSet.has(item));
      });
    };
    const intersection = intersectArrays(docsAsMatrix);
    if (intersection.length < 1) return [];
    for (const i of intersection) {
      const intersectionAndBestMatches = iiMatches.map((m) => {
        const matchedObj = m.filter((el) => el.docs.includes(i));
        const lowestMatches = matchedObj.reduce((acc, cur) => {
          if (acc.distance < cur.distance) return acc;
          else return cur;
        });
        return lowestMatches;
      });
      const totalDistance = intersectionAndBestMatches.reduce(
        (acc, cur) => acc.distance + cur.distance
      );
      const allQueryTerms = intersectionAndBestMatches.flatMap(
        (match) => match.queryTerm
      );
      if (totalDistance > 3) return {};
      finalMatchedDocs[i] = { distance: totalDistance, queryTerm: allQueryTerms };
    }
    return finalMatchedDocs;
  }

  // src/core/ranking.js
  function getRankedDocs(instance, matches) {
    const arrayOfDocMatchIds = Array.from(Object.keys(matches));
    let docMatches = instance.rawDocStore.filter(
      (doc) => arrayOfDocMatchIds.includes(doc.objectid)
    );
    docMatches = docMatches.map((doc) => {
      return { ...doc, typo: matches[doc.objectid] };
    });
    const customRanking = [
      { attribute: "typo", direction: -1 },
      ...instance.config.customRanking
    ];
    const dynamicSort = (data, customRanking2) => {
      return [...data].sort((a, b) => {
        for (const rule of customRanking2) {
          const { attribute, direction } = rule;
          const valA = Number(a[attribute]);
          const valB = Number(b[attribute]);
          if (valA > valB) return -1 * direction;
          if (valA < valB) return 1 * direction;
        }
        return 0;
      });
    };
    return dynamicSort(docMatches, customRanking);
  }

  // src/validators/settings.js
  var userSettings = {
    docSelector: ".card",
    searchableAttributes: ["title", "description"],
    stopWords: ["a", "and", "the", "f", "for"],
    attributesToRetrieve: ["*"],
    minCharsFor1Typo: 4,
    minCharsFor2Typos: 6,
    customRanking: [
      { attribute: "popularity", direction: 1 },
      { attribute: "price", direction: -1 }
    ],
    searchBarSelector: "#searchBar"
  };
  var engineDefaults = {
    disableTypoToleranceBeforeQueryLength: 3
  };
  function validateAndExportSettings(config) {
    if (!config) {
      throw new ConfigError("Please provide a config");
    }
    if (config.minCharsFor1Typo < 3) {
      throw new ConfigError("minCharsFor1Typo must be 3 or greater");
    }
    if (config.minCharsFor1Typo == config.minCharsFor2Typos) {
      throw new Error("minCharsFor1Typo and minCharsFor2Typos can't be equal");
    }
    if (config.minCharsFor1Typo > config.minCharsFor2Typos) {
      throw new Error("minCharsFor1Typo must be less than minCharsFor2Typos");
    }
    const validConfigKeys = Object.keys(userSettings);
    const userConfigKeys = Object.keys(config);
    for (const userConfigKey of userConfigKeys) {
      if (!validConfigKeys.includes(userConfigKey)) {
        throw new ConfigError(
          `"${userConfigKey}" is not a valid config attribute`
        );
      }
      userSettings[userConfigKey] = config[userConfigKey];
    }
    return { userSettings, engineDefaults };
  }

  // src/api/apiResponse.js
  var GenerateResponse = class {
    /**
     * Creates a new response object from ranked documents.
     * @param {Object} instance - The MinTie client instance.
     * @param {Object} instance.config - Client configuration.
     * @param {Array<string>} instance.config.attributesToRetrieve - Attributes to include in response.
     * @param {Array<Object>} docs - Array of ranked document objects.
     * @returns {Object} The formatted response with hits array.
     */
    constructor(instance, docs, invertedIndexMatches) {
      this.docs = docs;
      this.invertedIndexMatches = invertedIndexMatches;
      this.limitResponseFields(instance);
      this.generateHighlights();
      return this.buildResponse();
    }
    /**
     * Filters document attributes to only include those specified in attributesToRetrieve.
     * @private
     * @returns {void}
     */
    limitResponseFields(instance) {
      this.docs = this.docs.map((doc) => {
        return Object.fromEntries(
          Object.entries(doc).filter(
            ([key]) => instance.config.attributesToRetrieve.includes(key) || key === "objectid"
          )
        );
      });
    }
    generateHighlights() {
      const queryTerms = [];
      for (const key of Object.keys(this.invertedIndexMatches)) {
        queryTerms.push(...this.invertedIndexMatches[key].queryTerm);
      }
      const sortedTerms = [...queryTerms].sort((a, b) => b.length - a.length);
      const pattern = sortedTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      const regex = new RegExp(`\\b(${pattern})`, "gi");
      this.docs = this.docs.map((doc) => {
        const highlight = {};
        for (const [key, value] of Object.entries(doc)) {
          if (key === "objectid" || typeof value !== "string") continue;
          highlight[key] = value.replace(regex, (match) => `<em>${match}</em>`);
        }
        return { ...doc, highlights: highlight };
      });
    }
    // For that document, get the document's fields that aren't objectIDs
    // If that field contains text from queryTerms, add a new highlight field containing the attribute and highlighted value
    /**
     * Builds the final response object.
     * @private
     * @returns {Object} Response object with hits array.
     */
    buildResponse() {
      return {
        hits: this.docs
      };
    }
  };

  // src/index.js
  var Client = class {
    /**
     * The inverted index mapping tokens to document IDs.
     * @type {Object<string, Array<string>>}
     */
    invertedIndex = {};
    /**
     * Creates a new MinTie search client instance.
     * Initializes the search engine by processing documents and building the inverted index.
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
    constructor(config, docs) {
      const { userSettings: userSettings2, engineDefaults: engineDefaults2 } = validateAndExportSettings(config);
      this.config = userSettings2;
      this.engineDefaults = engineDefaults2;
      this.rawDocStore = processRawDocs(docs);
      this.invertedIndex = createInvertedIndex(this);
    }
    /**
     * Performs a search query and returns ranked results.
     * @param {string} query - The search query string.
     * @returns {Object} The search response object.
     * @returns {Array<Object>} return.hits - Array of matching documents.
     */
    apiSearch(query) {
      const queryTokens = normalise(this, query, "search");
      const invertedIndexMatches = getInvertedIndexMatches(this, queryTokens);
      if (Object.keys(invertedIndexMatches).length === 0) {
        const response2 = new GenerateResponse(this, [], []);
        return response2;
      }
      const rankedDocs = getRankedDocs(this, invertedIndexMatches);
      const response = new GenerateResponse(this, rankedDocs, invertedIndexMatches);
      return response;
    }
  };
  window.MinTie = {
    SearchClient: Client
  };
})();
