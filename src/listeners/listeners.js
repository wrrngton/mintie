/**
 * @fileoverview DOM event listeners for search functionality.
 * @module listeners/listeners
 */

/**
 * Creates and attaches event listeners for the search input.
 * @param {Object} instance - The MinTie client instance.
 * @param {Function} instance.search - The search method to call on input.
 * @returns {void}
 * @example
 * createEventListeners(clientInstance);
 * // Attaches input listener to #searchBox element
 */
export function createEventListeners(instance) {
    const searchBox = document.querySelector("#searchBox");
    searchBox.addEventListener("input", (e) => instance.search(e));
}
