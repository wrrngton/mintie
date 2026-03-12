import { ConfigError } from "./error.js";

// Default search settings, overridden during Client.init() if present
const defaultSettings = {
  docSelector: ".card",
  searchableAttributes: ["title", "description"],
  stopWords: ["a", "and", "the", "of", "for"],
  minCharsFor1Typo: 3,
  minCharsFor2Typos: 8,
  customRanking: [
    { attribute: "popularity", direction: 1 },
    { attribute: "price", direction: -1 },
  ],
  searchBarSelector: "#searchBar",
};

export function validateAndExportSettings(config) {
  if (!config) {
    throw new ConfigError("Please provide a config");
  }
  if (config.minCharsFor1Typo < 3) {
    throw new ConfigError("minCharsFor1Typo must be 3 or greater");
  }
  if (config.minCharsFor1Typo == config.minCharsFor2Typos) {
    throw new Error("minCharsFor1Typo and minCharsFor2Typos can't be equal");
  }
  if (config.minCharsFor1Typo > config.minCharsFor2Typos) {
    throw new Error("minCharsFor1Typo must be less than minCharsFor2Typos");
  }

  const validConfigKeys = Object.keys(defaultSettings);
  const userConfigKeys = Object.keys(config);

  for (const userConfigKey of userConfigKeys) {
    if (!validConfigKeys.includes(userConfigKey)) {
      throw new ConfigError(
        `"${userConfigKey}" is not a valid config attribute`,
      );
    }
    defaultSettings[userConfigKey] = config[userConfigKey];
  }

  return defaultSettings;
}
