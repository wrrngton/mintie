import { getLevenshteinDistance } from "./levenschtein.js";

function matchIsNotTooFuzzy(term, token) {
  // if (token.length < 4) 
  const distance = getLevenshteinDistance(token, term);

  if (distance > 2) return false;

  return true;
}

export function getInvertedIndexMatches(instance, queryTokens) {
  let match = false;

  for (const token of queryTokens) {
    if (!instance.invertedIndex.hasOwnProperty(token)) {
      return [];
    } else match = true;
  }

  const matchMatrix = [];

  for (const token of queryTokens) {
    // Ignore fuzzy matching on short token queries
    if (token.length > 2) {
      const invertedIndexTerms = Object.keys(instance.invertedIndex);
      const invertedIndexTermsFuzzyMatched = invertedIndexTerms.filter((term) =>
        matchIsNotTooFuzzy(term, token),
      );
      console.log(invertedIndexTermsFuzzyMatched, "egg");
    }

    matchMatrix.push(instance.invertedIndex[token]);
  }

  const matches = matchMatrix.reduce((acc, current) => {
    const currentSet = new Set(current);
    return acc.filter((item) => currentSet.has(item));
  });

  return matches;
}
