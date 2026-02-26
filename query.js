export function getInvertedIndexMatches(instance, queryTokens) {
  let match = false;

  for (const token of queryTokens) {
    if (!instance.invertedIndex.hasOwnProperty(token)) {
      return [];
    } else match = true;
  }

  const matchMatrix = [];

  for (const token of queryTokens) {
    matchMatrix.push(instance.invertedIndex[token]);
  }

  const matches = matchMatrix.reduce((acc, current) => {
    const currentSet = new Set(current);
    return acc.filter((item) => currentSet.has(item));
  });

  return matches;
}
