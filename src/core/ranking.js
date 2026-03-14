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

  // Tie breaking algorithm
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
