import { getLevenshteinDistance } from "./levenschtein.js";

function matchIsNotTooFuzzy(instance, term, token, acceptableNumTypos) {
  const distance = getLevenshteinDistance(token, term);

  if (distance > acceptableNumTypos) {
    return false;
  }
  return true;
}

export function getInvertedIndexMatches(instance, queryTokens) {
  const iiMatches = [];
  const invertedIndexTerms = Object.keys(instance.invertedIndex);

  for (const token of queryTokens) {
    const tokenLength = token.length;

    // Ignore fuzzy matching on short token queries. We only do fuzzy mathcing on 3 characters or more
    if (tokenLength < 3) {
      if (invertedIndexTerms.includes(token)) {
        iiMatches.push([token]);
      }
    } else {
      const acceptableNumTypos =
        tokenLength > instance.config.minCharsFor1Typo ? 2 : 1;
      const invertedIndexTermsFuzzyMatched = invertedIndexTerms.filter((term) =>
        matchIsNotTooFuzzy(instance, term, token, acceptableNumTypos),
      );
      iiMatches.push(invertedIndexTermsFuzzyMatched);
    }
  }

  // We don't need to check there are matches across more than 1 query token
  if (iiMatches.length === 1) {
    const finalMatchedDocs = Array.from(
      new Set(
        iiMatches
          .flat()
          .map((el) => instance.invertedIndex[el])
          .flat(),
      ),
    );
    return finalMatchedDocs;
  }

  const matchedDocs = iiMatches.map((el) => {
    const iiMatchesSub = el.flatMap((term) => instance.invertedIndex[term]);
    return Array.from(new Set(iiMatchesSub));
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
  const finalMatchedDocs = intersectArrays(matchedDocs);
  return finalMatchedDocs;
}
