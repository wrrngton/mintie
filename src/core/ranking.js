/**
 * @fileoverview Document ranking and sorting based on relevance and custom ranking rules.
 * @module core/ranking
 */

/**
 * Ranks and sorts matched documents based on typo distance and custom ranking rules.
 * Uses a tie-breaking algorithm that applies ranking rules in order of priority.
 * @param {Object} instance - The MinLia client instance.
 * @param {Array<Object>} instance.rawDocStore - Array of all processed documents.
 * @param {Object} instance.config - Client configuration.
 * @param {Array<Object>} instance.config.customRanking - Custom ranking rules.
 * @param {Object<string, number>} matches - Object mapping document IDs to typo distances.
 * @returns {Array<Object>} Sorted array of matched documents with typo scores.
 * @example
 * const ranked = getRankedDocs(instance, { "doc1": 0, "doc2": 1 });
 * // Returns documents sorted by typo distance, then custom ranking
 */
export function getRankedDocs(instance, matches) {
  const arrayOfDocMatchIds = Array.from(Object.keys(matches));
  let docMatches = instance.rawDocStore.filter((doc) =>
    arrayOfDocMatchIds.includes(doc.objectid),
  );

  // Append typo to doc custom ranking
  docMatches = docMatches.map((doc) => {
    return { ...doc, typo: matches[doc.objectid] };
  });

  /*Add typos to beginning of ranking formula
   * Does not affect underlying user configuration
   */
  const customRanking = [
    { attribute: "typo", direction: -1 },
    ...instance.config.customRanking,
  ];

  /**
   * Sorts data using multiple ranking criteria with tie-breaking.
   * @private
   * @param {Array<Object>} data - Documents to sort.
   * @param {Array<Object>} customRanking - Ranking rules with attribute and direction.
   * @returns {Array<Object>} Sorted documents.
   */
  const dynamicSort = (data, customRanking) => {
    return [...data].sort((a, b) => {
      for (const rule of customRanking) {
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
