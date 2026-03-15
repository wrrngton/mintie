import { QueryError } from "../utils/error.js";

export function getFacets(instance, rankedDocs) {
  const facets = {};

  // If no payload is passed, this function can be skipped. We pass an empty facets obj
  if (instance.payload == null) return {};

  const configFacets = instance.config.facets;

  // Check if provided lists of facet names is valid
  if (configFacets.length === 0)
    throw new QueryError(
      "No facets defined for your index, but you are trying to return facets. Update the 'facets' field in your configuration to include the facets you want to return",
    );

  // If checks pass, grab the facet names
  const facetNames = instance.payload.facets;

  const possibleFacets = configFacets.flatMap((facet) => {
    return Array.from(
      new Set(
        rankedDocs.map((doc) => (doc.hasOwnProperty(facet) ? facet : false)),
      ),
    );
  });

  for (const facet of facetNames) {
    if (!possibleFacets.includes(facet))
      throw new QueryError(
        "One or more of your query facets do not exist in your index",
      );

    facets[facet] = {};

    rankedDocs.forEach((doc) => {
      if (facets[facet].hasOwnProperty(doc[facet])) {
        facets[facet][doc[facet]] += 1;
      } else {
        if (doc[facet] == undefined) return;
        facets[facet][doc[facet]] = 1;
      }
    });
  }
  return facets;
}
