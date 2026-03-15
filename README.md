# MinTie

MinTie (mini tiebreaker) is a client side, vanilla Javascript interpretation of a tiebreaking search algorithm. Similar to [Lunr.js](https://lunrjs.com/), but instead of BM25, it uses a tie breaking algorithm, similar to search engines like Algolia.

Documents are retrieved from page markup via standard CSS selectors. Search behaviour is controlled via user defined configuration and query time parameters.

An [Inverted index](https://en.wikipedia.org/wiki/Inverted_index) is created at initialisation time and is used for efficient document lookups at query time.

## Installation

Download either minlia.js or minlia.min.js and add it to your site via a script tag:

```
<script src="mintie.js"></script>
```

An example project is available in the `/test` directory, which should provide an easy start guide to get up and running.

## Features

- **Typo tolerance**: Each query token is calculated against the search index for hits leveraging a [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) algorithm. Typo thresholds can be set via a user defined cofig.

- **Tie breaking algorithm**: Documents are ranked against a tie breaking algorithm. Tie breaking attributes and values can be set as html data attributes.

- **Searchable attributes**: Define which attributes should be searchable.

- **Stop words**: Define which word should not be considered when performing searches.

