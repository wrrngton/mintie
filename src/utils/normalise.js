const punctuationRegex = /[^a-zA-Z0-9 ]/g;

export function normalise(instance, term, type) {
  const masterTokens = [];
  const splitVals = term
    .toLowerCase()
    .trim()
    .replace(punctuationRegex, "")
    .split(" ");

  // We just split queries on white space to separate terms, docs have a different normalisation process
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
