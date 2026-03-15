/**
 * @fileoverview Custom error classes for MinTie.
 * @module utils/error
 */

/**
 * Error thrown when there is a configuration problem.
 * @class
 * @extends Error
 * @example
 * throw new ConfigError("Invalid docSelector provided");
 */
export class ConfigError extends Error {
  /**
   * Creates a new ConfigError.
   * @param {string} errorMessage - The error message describing the configuration problem.
   */
  constructor(errorMessage) {
    super(errorMessage)
    this.name = "ConfigError"
  }
}

/**
 * Error thrown when there is a problem with a search query.
 * @class
 * @extends Error
 * @example
 * throw new QueryError("Query string cannot be empty");
 */
export class QueryError extends Error {
  /**
   * Creates a new QueryError.
   * @param {string} errorMessage - The error message describing the query problem.
   */
  constructor(errorMessage) {
    super(errorMessage)
    this.name = "QueryError"
  }
}
