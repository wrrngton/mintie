/**
 * @fileoverview Inverted index creation for efficient full-text search.
 * @module core/invertedIndex
 */

import { normalise} from "../utils/normalise.js";

/**
 * Creates an inverted index from the document store.
 * Maps each unique token to an array of document IDs containing that token.
 * @param {Object} instance - The MinTie client instance.
 * @param {Array<Object>} instance.rawDocStore - Array of processed documents.
 * @param {Object} instance.config - The client configuration.
 * @param {Array<string>} instance.config.stopWords - Words to exclude from indexing.
 * @returns {Object<string, Array<string>>} Inverted index mapping tokens to document IDs.
 * @example
 * // Returns structure like:
 * // { "laptop": ["doc1", "doc2"], "computer": ["doc1"] }
 */
export function createInvertedIndex(instance) {
  const invertedIndex = {};

  for (const doc of instance.rawDocStore) {
    // Each document gets a wildcard selector for wildcard matching
    const docTokens = ["*"];

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
