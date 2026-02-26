import { normalise} from "./normalise.js";

export function createInvertedIndex(instance) {
  const invertedIndex = {};

  for (const doc of instance.rawDocStore) {
    const docTokens = [];

    for (const [key, value] of Object.entries(doc)) {
      if (key == "objectid") continue;

      const attributeTokens = normalise(instance, value);

      attributeTokens.forEach((token) => {
        if (instance.config.stopWords.includes(token)) return;
        docTokens.push(token);
      });
    }

    const docTokensSet = new Set(docTokens);
    const uniqueDocTokens = [...docTokensSet];

    for (const token of uniqueDocTokens) {
      if (invertedIndex.hasOwnProperty(token)) {
        invertedIndex[token].push(doc.objectid);
      } else {
        invertedIndex[token] = [doc.objectid];
      }
    }
  }
  return invertedIndex;
}
