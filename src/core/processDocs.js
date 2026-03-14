import { ConfigError } from "../utils/error.js";

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
      if (doc.dataset[att]) {
        rawDocObj[att] = doc.dataset[att];
      }
    }
    for (const att of instance.config.facets) {
      if (doc.dataset[att]) {
        rawDocObj[att] = doc.dataset[att];
      }
    }
    for (const att of instance.config.customRanking) {
      if (doc.dataset[att.attribute]) {
        rawDocObj[att.attribute] = doc.dataset[att.attribute];
      }
    }
    return rawDocObj;
  });
  return rawDocumentsData;
}
