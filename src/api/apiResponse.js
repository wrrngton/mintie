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
    // Unpack query terms from invertedIndexMatches
    const queryTerms = [];
    for (const key of Object.keys(this.invertedIndexMatches)) {
      queryTerms.push(...this.invertedIndexMatches[key].queryTerm);
    }

    // Loop through each document
    this.docs = this.docs.map((doc) => {
      for (const [key, value] of Object.entries(doc)) {
        if (key === "objectid") continue; 

        const lowercaseVal = value.toLowerCase();

        for (const term of queryTerms) {
          if (lowercaseVal.includes(term)) {
            const newSentence = lowercaseVal
              .split(" ")
              .map((word) => {
                return word.startsWith(term)
                  ? word.replace(term, `<em>${term}</em>`)
                  : word;
              })
              .join(" ");

            return {
              ...doc,
              highlight: newSentence,
            };
          }
        }
      }
      return doc; 
    });
    console.log(this.docs);
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
