# MinLia

MinLia (mini Algolia) is a client side, vanilla Javascript interpretation of Algolia. Similar to [Lunr.js](https://lunrjs.com/), but instead of BM25, it uses a tie breaking algorithm, like Algolia.

Documents are retrieved from page markup via standard CSS selectors. Search behaviour is controlled via user defined configuration and query time parameters.

An [Inverted index](https://en.wikipedia.org/wiki/Inverted_index) is created at initialisation time and is used for efficient document lookups at query time.

## Installation

Download either minlia.js or minlia.min.js

## Features

- **Typo tolerance**: Each query token is calculated against the search index for hits leveraging a [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) algorithm. Typo thresholds can be set via a user defined cofig.

- **Tie breaking algorithm**: Documents are ranked against a tie breaking algorithm. Tie breaking attributes and values can be set as html data attributes.

- **Searchable attributes**: Define which attributes should be searchable.

- **Stop words**: Define which word should not be considered when performing searches.

