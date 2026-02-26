export function getRankedDocs(instance, matches) {
  const docMatches = instance.rawDocStore.filter((doc) =>
    matches.includes(doc.objectid),
  );
}
