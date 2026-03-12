export function getRankedDocs(instance, matches) {
  const docMatches = instance.rawDocStore.filter((doc) =>
    matches.includes(doc.objectid),
  );
  const customRanking = instance.config.customRanking;

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
