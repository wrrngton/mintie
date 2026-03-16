/**
 * @fileoverview Document processing utilities for extracting and preparing documents from the DOM.
 * @module core/processDocs
 */

import { ConfigError } from "../utils/error.js";

/**
 * Processes raw documents from the JS object passed as initialisation time.
 * Validates JSON.
 * @param {Array<Object>} instance - The MinTie client instance.
 * @param {Object} instance.config - The client configuration.
 * @returns {Array<Object>} Array of validated documents.
 * @throws {ConfigError} If any validation fails.
 * @example
 * // Given HTML:  [{ objectid: "1", title: "Product" }]
 * // Returns: [{ objectid: "1", title: "Product" }]
 */
export function processRawDocs(docs) {
  const typeHashMap = {};

  if (typeof docs !== "object" || docs == null) {
    throw new ConfigError("Supplied documents are not objects or is null");
  }

  for (const doc of docs) {
    const objectid = doc.objectid;

    if (objectid == undefined) {
      throw new ConfigError("All docs must have an objectid field");
    }

    if (typeof objectid !== "string") {
      throw new ConfigError("Objectids must all be strings");
    }

    for (const [key, value] of Object.entries(doc)) {
      if (typeHashMap.hasOwnProperty(key)) typeHashMap[key].push(typeof value);
      else typeHashMap[key] = [typeof value];
    }
  }

  for (const [key, value] of Object.entries(typeHashMap)) {
    const uniqueArr = [...new Set(value)];

    if (uniqueArr.length > 1)
      throw new ConfigError(
        `Your documents cannot have mixed types per attribute. Different data types detectes for ${key}.`,
      );
  }

  return docs;
}
