/**
 * @fileoverview Query processing and fuzzy matching against the inverted index.
 * @module core/query
 */

import { getLevenshteinDistance } from "../utils/levenschtein.js";

/**
 * Checks if a term matches a token within acceptable typo tolerance.
 * @private
 * @param {Object} instance - The MinTie client instance.
 * @param {string} term - The indexed term to check.
 * @param {string} token - The query token to match against.
 * @param {number} acceptableNumTypos - Maximum allowed Levenshtein distance.
 * @returns {Object|Array} Match object with docs and distance, or empty array if no match.
 */
function matchIsNotTooFuzzy(instance, term, token, acceptableNumTypos) {
  const distance = getLevenshteinDistance(token, term);

  if (distance > acceptableNumTypos) {
    return [];
  }

  return {
    docs: instance.invertedIndex[term],
    distance: distance,
    // Query term tracks the matching intervered index term for later snippeting and highlighting
    queryTerm: [term],
  };
}

/**
 * Finds matching documents in the inverted index for the given query tokens.
 * Supports fuzzy matching with configurable typo tolerance based on token length.
 * @param {Object} instance - The MinTie client instance.
 * @param {Object} instance.invertedIndex - The inverted index to search.
 * @param {Object} instance.config - Client configuration.
 * @param {number} instance.config.minCharsFor1Typo - Min chars to allow 1 typo.
 * @param {number} instance.config.minCharsFor2Typos - Min chars to allow 2 typos.
 * @param {Object} instance.engineDefaults - Engine default settings.
 * @param {Array<string>} queryTokens - Tokenized search query.
 * @returns {Object<string, number>} Object mapping document IDs to their typo distance scores.
 * @example
 * const matches = getInvertedIndexMatches(instance, ["laptop", "cheap"]);
 * // Returns: { "doc1": 0, "doc2": 1 } where values are typo distances
 */
export function getInvertedIndexMatches(instance, queryTokens) {
  // Multidimensional array to support both 1 query token and N query tokens
  const iiMatches = [];

  // Unpack all the terms in the inverted index
  const invertedIndexTerms = Object.keys(instance.invertedIndex);

  for (const token of queryTokens) {
    const tokenLength = token.length;

    // Ignore fuzzy matching on short token queries. We only do fuzzy matching on 3 characters or more
    if (
      tokenLength <=
      instance.engineDefaults.disableTypoToleranceBeforeQueryLength
    ) {
      if (invertedIndexTerms.includes(token)) {
        iiMatches.push([
          {
            docs: instance.invertedIndex[token],
            distance: 0,
            queryTerm: [token],
          },
        ]);
      }
    } else {
      if (
        tokenLength >
        instance.engineDefaults.disableTypoToleranceBeforeQueryLength &&
        tokenLength >= instance.config.minCharsFor1Typo &&
        tokenLength < instance.config.minCharsFor2Typos
      ) {
        acceptableNumTypos = 1;
      } else if (tokenLength >= instance.config.minCharsFor2Typos) {
        acceptableNumTypos = 2;
      } else {
        acceptableNumTypos = 0;
      }

      const invertedIndexTermsFuzzyMatched = invertedIndexTerms.flatMap(
        (term) => matchIsNotTooFuzzy(instance, term, token, acceptableNumTypos),
      );
      iiMatches.push(invertedIndexTermsFuzzyMatched);
    }
  }

  // Handle no results case
  if (iiMatches.length === 0) return {};

  /* iiMatches can be a shallow, 1dimensional array if there is only query token
   * We don't need to do an AND check across more than 1 array for query matches
   */
  const finalMatchedDocs = {};

  if (iiMatches.length === 1) {
    // iiMatches is only 1 long, so we fetch first array
    const matchedArray = iiMatches[0];

    for (let i = 0; i < matchedArray.length; i++) {
      const docsArr = matchedArray[i].docs;
      const term = matchedArray[i].queryTerm;
      const docDistance = matchedArray[i].distance;
      for (let j = 0; j < docsArr.length; j++) {
        const docID = docsArr[j];
        if (
          finalMatchedDocs.hasOwnProperty(docID) &&
          finalMatchedDocs[docID] < docDistance
        ) {
          continue;
        } else {
          finalMatchedDocs[docID] = {
            distance: docDistance,
            queryTerm: term,
          };
        }
      }
    }
    return finalMatchedDocs;
  }

  // Flatten array docs into a 2d array to check for matches across both arrays
  const docsAsMatrix = iiMatches.map((match) => {
    const new_arr = [];
    for (const f of match) {
      new_arr.push(...f.docs);
    }
    return Array.from(new Set(new_arr));
  });

  /* Check doc matches across both sub arrays
   * This could well be changed in the future to account for AND / OR operators
   */
  const intersectArrays = (arrays) => {
    return arrays.reduce((acc, currentArray) => {
      const currentSet = new Set(currentArray);
      return acc.filter((item) => currentSet.has(item));
    });
  };
  const intersection = intersectArrays(docsAsMatrix);

  // If no common item across arrays, there is no match
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
      (acc, cur) => acc.distance + cur.distance,
    );

    const allQueryTerms = intersectionAndBestMatches.flatMap(
      (match) => match.queryTerm,
    );

    // Acceptable typos across all tokens
    if (totalDistance > 3) return {};
    finalMatchedDocs[i] = { distance: totalDistance, queryTerm: allQueryTerms };
  }

  return finalMatchedDocs;
}
