/**
 * @fileoverview Text normalization utilities for tokenizing documents and queries.
 * @module utils/normalise
 */

/**
 * Regular expression to remove punctuation from text.
 * @constant {RegExp}
 * @private
 */
const punctuationRegex = /[^a-zA-Z0-9 ]/g;

/**
 * Normalizes and tokenizes text for indexing or searching.
 * For search queries, splits on whitespace.
 * For documents, creates progressive token prefixes for prefix matching.
 * @param {Object} instance - The MinTie client instance (unused but passed for consistency).
 * @param {string} term - The text to normalize.
 * @param {string} type - The normalization type: "search" for queries, "docs" for documents.
 * @returns {Array<string>} Array of normalized tokens.
 * @example
 * // Search normalization
 * normalise(instance, "Hello World!", "search");
 * // Returns: ["hello", "world"]
 *
 * // Document normalization (creates prefixes)
 * normalise(instance, "cat", "docs");
 * // Returns: ["c", "ca", "cat"]
 */
export function normalise(instance, term, type) {
  /* If query is exactly a * then it is a wildcard selector and we just return back the query
   * With no normalisation
   * We have to check if it's a query normalisation or not first as well
   */
  if (type === "search" && term.trim() === "*") {
    return term;
  }

  const masterTokens = [];
  // toString() to account for making ints and floats searchable
  const splitVals = term
    .toString()
    .toLowerCase()
    .trim()
    .replace(punctuationRegex, "")
    .split(" ");

  // We just split queries on white space to separate terms, documents have a different normalisation process
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

  const combinedArrays = masterTokens.reduce((accumulator, currentVal) =>
    currentVal.concat(accumulator),
  );

  return combinedArrays;
}
