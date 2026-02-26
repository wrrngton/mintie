const punctuationRegex = /[^a-zA-Z0-9 ]/g;

export function normalise(instance, term) {
  const splitVals = term
    .toLowerCase()
    .trim()
    .replace(punctuationRegex, "")
    .split(" ");

  return splitVals;
}
