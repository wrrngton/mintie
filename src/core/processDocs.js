/**
 * @fileoverview Document processing utilities for extracting and preparing documents from the DOM.
 * @module core/processDocs
 */

import { ConfigError } from "../utils/error.js";

/**
 * Processes raw documents from the DOM based on the configured selector.
 * Extracts searchable attributes and custom ranking attributes from data attributes.
 * @param {Object} instance - The MinLia client instance.
 * @param {Object} instance.config - The client configuration.
 * @param {string} instance.config.docSelector - CSS selector for document elements.
 * @param {Array<string>} instance.config.searchableAttributes - Attributes to extract for searching.
 * @param {Array<Object>} instance.config.customRanking - Custom ranking configuration.
 * @returns {Array<Object>} Array of processed document objects with objectid and extracted attributes.
 * @throws {ConfigError} If no documents match the docSelector.
 * @example
 * // Given HTML: <div class="card" data-objectid="1" data-title="Product">...</div>
 * const docs = processRawDocs(clientInstance);
 * // Returns: [{ objectid: "1", title: "Product" }]
 */
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
    for (const att of instance.config.customRanking) {
      if (doc.dataset[att.attribute]) {
        rawDocObj[att.attribute] = doc.dataset[att.attribute];
      }
    }
    return rawDocObj;
  });
  return rawDocumentsData;
}
