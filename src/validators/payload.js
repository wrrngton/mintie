import { ConfigError } from "../utils/error";

const VALID_FIELDS_TYPES = {
  docsPerPage: "number",
};

const defaultPayload = {
  docsPerPage: 10,
};

export function validatePayload(payload) {
  // If there is no user supplied payload, we return default payload
  if (!payload) return defaultPayload;

  const payloadKeysAndValues = Object.entries(payload);
  const validFieldKeys = Object.keys(VALID_FIELDS_TYPES);

  for (const [key, value] of payloadKeysAndValues) {
    if (!validFieldKeys.includes(key)) {
      throw new ConfigError(`"${key}" is not a valid query parameter`);
    }

    if (typeof value !== VALID_FIELDS_TYPES[key]) {
      throw new ConfigError(
        `The type of ${key} is ${typeof value} when it should be  ${VALID_FIELDS_TYPES[key]}`,
      );
    }

    if (payload.docsPerPage && payload.docsPerPage === 0) {
      throw new ConfigError(`docsPerPage cannot be 0`);
    }

    defaultPayload[key] = value;
  }

  return defaultPayload;
}
