(() => {
  // src/utils/normalise.js
  var punctuationRegex = /[^a-zA-Z0-9 ]/g;
  function normalise(instance, term, type) {
    const masterTokens = [];
    const splitVals = term.toLowerCase().trim().replace(punctuationRegex, "").split(" ");
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
    constructor(errorMessage) {
      super(errorMessage);
      this.name = "ConfigError";
    }
  };
  var QueryError = class extends Error {
    constructor(errorMessage) {
      super(errorMessage);
      this.name = "QueryError";
    }
  };

  // src/core/processDocs.js
  function processRawDocs(instance) {
    const rawDocuments = Array.from(
      document.querySelectorAll(instance.config.docSelector)
    );
    if (rawDocuments.length === 0) {
      throw new ConfigError(
        `The "${instance.config.docSelector}" docSelector returned no documents`
      );
    }
    const rawDocumentsData = rawDocuments.map((doc) => {
      let rawDocObj = {};
      rawDocObj.objectid = doc.dataset.objectid;
      for (const att of instance.config.searchableAttributes) {
        if (doc.dataset[att]) {
          rawDocObj[att] = doc.dataset[att];
        }
      }
      for (const att of instance.config.facets) {
        if (doc.dataset[att]) {
          rawDocObj[att] = doc.dataset[att];
        }
      }
      for (const att of instance.config.customRanking) {
        if (doc.dataset[att.attribute]) {
          rawDocObj[att.attribute] = doc.dataset[att.attribute];
        }
      }
      return rawDocObj;
    });
    return rawDocumentsData;
  }

  // src/core/invertedIndex.js
  function createInvertedIndex(instance) {
    const invertedIndex = {};
    for (const doc of instance.rawDocStore) {
      const docTokens = [];
      for (const [key, value] of Object.entries(doc)) {
        if (key == "objectid") continue;
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

  // src/core/filtering.js
  function filterParser(filters) {
    console.log(filters);
  }
  function filtering(instance, rankedDocs) {
    if (instance.payload === null) return rankedDocs;
    if (rankedDocs == null) {
      return;
    }
    const filters = filterParser(instance.payload.filters);
  }

  // src/core/query.js
  function matchIsNotTooFuzzy(instance, term, token, acceptableNumTypos2) {
    const distance = getLevenshteinDistance(token, term);
    if (distance > acceptableNumTypos2) {
      return [];
    }
    return {
      docs: instance.invertedIndex[term],
      distance
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
              distance: 0
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
        const docDistance = matchedArray[i].distance;
        for (let j = 0; j < docsArr.length; j++) {
          const docID = docsArr[j];
          if (finalMatchedDocs.hasOwnProperty(docID) && finalMatchedDocs[docID] < docDistance) {
            continue;
          } else {
            finalMatchedDocs[docID] = docDistance;
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
      if (totalDistance > 3) return {};
      finalMatchedDocs[i] = totalDistance;
    }
    return finalMatchedDocs;
  }

  // src/core/queryFacets.js
  function getFacets(instance, rankedDocs) {
    const facets = {};
    if (instance.payload == null) return {};
    const configFacets = instance.config.facets;
    if (configFacets.length === 0)
      throw new QueryError(
        "No facets defined for your index, but you are trying to return facets. Update the 'facets' field in your configuration to include the facets you want to return"
      );
    const facetNames = instance.payload.facets;
    const possibleFacets = configFacets.flatMap((facet) => {
      return Array.from(
        new Set(
          rankedDocs.map((doc) => doc.hasOwnProperty(facet) ? facet : false)
        )
      );
    });
    for (const facet of facetNames) {
      if (!possibleFacets.includes(facet))
        throw new QueryError(
          "One or more of your query facets do not exist in your index"
        );
      facets[facet] = {};
      rankedDocs.forEach((doc) => {
        if (facets[facet].hasOwnProperty(doc[facet])) {
          facets[facet][doc[facet]] += 1;
        } else {
          if (doc[facet] == void 0) return;
          facets[facet][doc[facet]] = 1;
        }
      });
    }
    return facets;
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
    facets: [],
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

  // src/validators/payload.js
  var payloadSettings = {
    filters: "",
    facets: []
  };
  var validPayloadAttributes = Object.keys(payloadSettings);
  function validatePayload(instance) {
    if (instance.payload === null) return;
    for (const payloadAttribute of Object.keys(instance.payload)) {
      if (!validPayloadAttributes.includes(payloadAttribute)) {
        throw new ConfigError(
          `${instance.payloadAttribute} is not a valid query parameter`
        );
      }
    }
    if (instance.payload.hasOwnProperty("filters")) {
      if (typeof instance.payload.filters !== "string") {
        throw new ConfigError("Filters must be a valid string");
      }
    }
    if (instance.payload.hasOwnProperty("facets")) {
      if (!Array.isArray(instance.payload.facets)) {
        throw new ConfigError("Facets must be an array");
      }
      if (instance.payload.facets.length == 0) {
        throw new ConfigError("Facets cannot be an empty array");
      }
      for (const queryFacet of instance.payload.facets) {
        if (!instance.config.facets.includes(queryFacet)) {
          throw new ConfigError(
            `"${queryFacet}" must also be included in your config facets list`
          );
        }
      }
    }
  }

  // src/api/apiResponse.js
  var GenerateResponse = class {
    constructor(instance, docs, facets) {
      this.docs = docs;
      this.facets = facets;
      this.attributesToRetrieve = instance.config.attributesToRetrieve;
      this.limitResponseFields();
      return this.buildResponse();
    }
    limitResponseFields() {
      this.docs = this.docs.map((doc) => {
        return Object.fromEntries(
          Object.entries(doc).filter(
            ([key]) => this.attributesToRetrieve.includes(key)
          )
        );
      });
    }
    buildResponse() {
      return {
        hits: this.docs,
        facets: this.facets
      };
    }
  };

  // src/index.js
  var Client = class {
    rawDocStore = [];
    invertedIndex = {};
    payload = null;
    constructor(config) {
      const { userSettings: userSettings2, engineDefaults: engineDefaults2 } = validateAndExportSettings(config);
      this.config = userSettings2;
      this.engineDefaults = engineDefaults2;
      this.rawDocStore = processRawDocs(this);
      this.invertedIndex = createInvertedIndex(this);
    }
    filterResults(rankedDocs = null) {
      const filteredResults = filtering(this, rankedDocs);
      return filteredResults;
    }
    apiSearch(query, payload = null) {
      this.payload = payload !== null ? payload : null;
      validatePayload(this);
      const queryTokens = normalise(this, query, "search");
      const invertedIndexMatches = getInvertedIndexMatches(this, queryTokens);
      if (Object.keys(invertedIndexMatches).length === 0) {
        const response2 = new GenerateResponse(this, [], []);
        return response2;
      }
      const rankedDocs = getRankedDocs(this, invertedIndexMatches);
      const filteredResults = this.filterResults(this, rankedDocs);
      const facetsForQuery = getFacets(this, rankedDocs);
      const response = new GenerateResponse(this, rankedDocs, facetsForQuery);
      return response;
    }
  };
  window.MinLia = {
    SearchClient: Client
  };
})();
//# sourceMappingURL=minlia.js.map
