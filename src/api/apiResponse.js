/**
 * @fileoverview API response generation for search results.
 * @module api/apiResponse
 */

/**
 * Generates and formats the API response for search queries.
 * Filters document attributes based on configuration.
 * @class
 * @example
 * const response = new GenerateResponse(instance, rankedDocs);
 * // Returns: { hits: [...] }
 */
export class GenerateResponse {
  /**
   * Creates a new response object from ranked documents.
   * @param {Object} instance - The MinTie client instance.
   * @param {Object} instance.config - Client configuration.
   * @param {Array<string>} instance.config.attributesToRetrieve - Attributes to include in response.
   * @param {Array<Object>} docs - Array of ranked document objects.
   * @returns {Object} The formatted response with hits array.
   */
  constructor(instance, docs, invertedIndexMatches) {
    this.docs = docs;
    this.invertedIndexMatches = invertedIndexMatches;
    this.limitResponseFields(instance);
    this.generateHighlights();
    return this.buildResponse();
  }

  /**
   * Filters document attributes to only include those specified in attributesToRetrieve.
   * @private
   * @returns {void}
   */
  limitResponseFields(instance) {
    this.docs = this.docs.map((doc) => {
      return Object.fromEntries(
        Object.entries(doc).filter(
          ([key]) =>
            instance.config.attributesToRetrieve.includes(key) ||
            key === "objectid",
        ),
      );
    });
  }

  generateHighlights() {
    const queryTerms = [];
    for (const key of Object.keys(this.invertedIndexMatches)) {
      queryTerms.push(...this.invertedIndexMatches[key].queryTerm);
    }

    const sortedTerms = [...queryTerms].sort((a, b) => b.length - a.length);
    const pattern = sortedTerms
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");

    const regex = new RegExp(`\\b(${pattern})`, "gi");

    this.docs = this.docs.map((doc) => {
      const highlight = {};

      for (const [key, value] of Object.entries(doc)) {
        if (key === "objectid" || typeof value !== "string") continue;

        highlight[key] = value.replace(regex, (match) => `<em>${match}</em>`);
      }

      return { ...doc, highlights: highlight };
    });
  }

  // For that document, get the document's fields that aren't objectIDs
  // If that field contains text from queryTerms, add a new highlight field containing the attribute and highlighted value

  /**
   * Builds the final response object.
   * @private
   * @returns {Object} Response object with hits array.
   */
  buildResponse() {
    return {
      hits: this.docs,
    };
  }
}
