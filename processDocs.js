export function processRawDocs(instance) {
  const rawDocuments = Array.from(
    document.querySelectorAll(instance.config.docSelector),
  );
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
