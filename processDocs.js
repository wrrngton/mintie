import { ConfigError } from "./error.js";

export function processRawDocs(instance) {
  const rawDocuments = Array.from(
    document.querySelectorAll(instance.config.docSelector),
  );

  if (rawDocuments.length === 0) {
    throw new ConfigError(
      `The "${instance.config.docSelector}" docSelector returned no documents`,
    );
  }

  const rawDocumentsData = rawDocuments.map((doc) => {
    let rawDocObj = {};
    rawDocObj.objectid = doc.dataset.objectid;
    for (const att of instance.config.searchableAttributes) {
      rawDocObj[att] = doc.dataset[att];
    }
    for (const att of instance.config.customRanking) {
      rawDocObj[att.attribute] = doc.dataset[att.attribute];
    }
    return rawDocObj;
  });
  return rawDocumentsData;
}
