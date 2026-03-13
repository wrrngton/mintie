(() => {
  // normalise.js
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

  // error.js
  var ConfigError = class extends Error {
    constructor(errorMessage) {
      super(errorMessage);
      this.name = "ConfigError";
    }
  };

  // processDocs.js
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
        rawDocObj[att] = doc.dataset[att];
      }
      for (const att of instance.config.customRanking) {
        rawDocObj[att.attribute] = doc.dataset[att.attribute];
      }
      return rawDocObj;
    });
    return rawDocumentsData;
  }

  // invertedIndex.js
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

  // levenschtein.js
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

  // query.js
  function matchIsNotTooFuzzy(instance, term, token, acceptableNumTypos) {
    const distance = getLevenshteinDistance(token, term);
    if (distance > acceptableNumTypos) {
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
      if (tokenLength < 3) {
        if (invertedIndexTerms.includes(token)) {
          iiMatches.push([
            {
              docs: instance.invertedIndex[token],
              distance: 0
            }
          ]);
        }
      } else {
        const acceptableNumTypos = tokenLength > instance.config.minCharsFor1Typo ? 2 : 1;
        const invertedIndexTermsFuzzyMatched = invertedIndexTerms.flatMap(
          (term) => matchIsNotTooFuzzy(instance, term, token, acceptableNumTypos)
        );
        iiMatches.push(invertedIndexTermsFuzzyMatched);
      }
    }
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
      const flattened = match.flat();
      for (const f of flattened) return f.docs;
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

  // ranking.js
  function getRankedDocs(instance, matches) {
    const docMatches = instance.rawDocStore.filter(
      (doc) => matches.includes(doc.objectid)
    );
    const customRanking = instance.config.customRanking;
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

  // settings.js
  var defaultSettings = {
    docSelector: ".card",
    searchableAttributes: ["title", "description"],
    stopWords: ["a", "and", "the", "of", "for"],
    minCharsFor1Typo: 3,
    minCharsFor2Typos: 8,
    customRanking: [
      { attribute: "popularity", direction: 1 },
      { attribute: "price", direction: -1 }
    ],
    searchBarSelector: "#searchBar"
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
    const validConfigKeys = Object.keys(defaultSettings);
    const userConfigKeys = Object.keys(config);
    for (const userConfigKey of userConfigKeys) {
      if (!validConfigKeys.includes(userConfigKey)) {
        throw new ConfigError(
          `"${userConfigKey}" is not a valid config attribute`
        );
      }
      defaultSettings[userConfigKey] = config[userConfigKey];
    }
    return defaultSettings;
  }

  // src.js
  var Client = class {
    rawDocStore = [];
    invertedIndex = {};
    constructor(config) {
      this.config = validateAndExportSettings(config);
    }
    init() {
      this.rawDocStore = processRawDocs(this);
      this.invertedIndex = createInvertedIndex(this);
    }
    apiSearch(query) {
      const queryTokens = normalise(this, query, "search");
      const invertedIndexMatches = getInvertedIndexMatches(this, queryTokens);
      if (Objects.keys(invertedIndexMatches).length === 0) {
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
  };
  window.MinLia = {
    SearchClient: Client
  };
})();
//# sourceMappingURL=minlia.js.map
