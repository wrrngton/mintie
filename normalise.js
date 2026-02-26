const punctuationRegex = /[^a-zA-Z0-9 ]/g;

export function normalise(instance, term) {
  const masterTokens = []
  const splitVals = term
    .toLowerCase()
    .trim()
    .replace(punctuationRegex, "")
    .split(" ");

  for (const singleTerm of splitVals) {
    const smallTokens = [];
    const singleTokensSplit = singleTerm.split("");
    for (const tok in singleTokensSplit) {
      if(smallTokens.length === 0) {
        smallTokens.push(singleTokensSplit[tok]);
      }
      else {
        const minusOneToken = tok - 1; 
        const fString = `${smallTokens[minusOneToken]}${singleTokensSplit[tok]}`;
        smallTokens.push(fString);
      }
    }
    masterTokens.push(smallTokens);
  }

  const combinedArrays = masterTokens.reduce((accumulator, currentVal) => currentVal.concat(accumulator));

  return combinedArrays;
}
