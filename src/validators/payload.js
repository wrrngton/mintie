import { ConfigError } from "../utils/error";

const payloadSettings = {
  filters: "",
  facets: [],
};

const validPayloadAttributes = Object.keys(payloadSettings);

export function validatePayload(instance) {
  if (instance.payload === null) return;

  for (const payloadAttribute of Object.keys(instance.payload)) {
    if (!validPayloadAttributes.includes(payloadAttribute)) {
      throw new ConfigError(
        `${instance.payloadAttribute} is not a valid query parameter`,
      );
    }
  }

  if (instance.payload.hasOwnProperty("filters")) {
    if (typeof instance.payload.filters !== "string") {
      throw new ConfigError("Filters must be a valid string");
    }
  }

  if (instance.payload.hasOwnProperty("facets")) {
    if (!Array.isArray(instance.payload.facets)) {
      throw new ConfigError("Facets must be an array");
    }
    if (instance.payload.facets.length == 0) {
      throw new ConfigError("Facets cannot be an empty array");
    }

    for (const queryFacet of instance.payload.facets) {
      if (!instance.config.facets.includes(queryFacet)) {
        throw new ConfigError(
          `"${queryFacet}" must also be included in your config facets list`,
        );
      }
    }
  }  
}
