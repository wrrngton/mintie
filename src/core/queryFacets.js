import { QueryError } from "../utils/error.js";

export function getFacets(instance, docIDs, facetNames) {
  const rawDocStore = instance.rawDocStore;
  const facets = {};

  // Check if provided lists of facet names is valid
  const configFacets = instance.config.facets;

  if (configFacets.length === 0)
    throw new QueryError(
      "No facets defined for your index, but you are trying to return facets. Update the 'facets' field in your configuration",
    );

  const possibleFacets = configFacets.flatMap((facet) => {
    return Array.from(
      new Set(
        rawDocStore.map((doc) => (doc.hasOwnProperty(facet) ? facet : false)),
      ),
    );
  });

  for (const facet of facetNames) {
    if (!possibleFacets.includes(facet))
      throw new QueryError(
        "One or more of your query facets do not exist in your index",
      );

    facets[facet] = {};

    for (const docID of docIDs) {
      const rawDocs = rawDocStore.filter((doc) => doc.objectid === docID);
      rawDocs.forEach((doc) => {
        if (facets[facet].hasOwnProperty(doc[facet]))
          facets[facet][doc[facet]] += 1;
        else {
          facets[facet][doc[facet]] = 1;
        }
      });
    }
  }
  console.log(facets);
}
