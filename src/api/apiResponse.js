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
   * @param {Object} instance - The MinLia client instance.
   * @param {Object} instance.config - Client configuration.
   * @param {Array<string>} instance.config.attributesToRetrieve - Attributes to include in response.
   * @param {Array<Object>} docs - Array of ranked document objects.
   * @returns {Object} The formatted response with hits array.
   */
  constructor(instance, docs) {
    this.docs = docs;
    this.attributesToRetrieve = instance.config.attributesToRetrieve;
    this.limitResponseFields();
    return this.buildResponse();
  }

  /**
   * Filters document attributes to only include those specified in attributesToRetrieve.
   * @private
   * @returns {void}
   */
  limitResponseFields() {
    this.docs = this.docs.map((doc) => {
      return Object.fromEntries(
        Object.entries(doc).filter(([key]) =>
          this.attributesToRetrieve.includes(key),
        ),
      );
    });
  }

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
