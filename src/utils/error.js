export class ConfigError extends Error {
  constructor(errorMessage) {
    super(errorMessage)
    this.name = "ConfigError"
  }
}

export class QueryError extends Error {
  constructor(errorMessage) {
    super(errorMessage)
    this.name = "QueryError"
  }
}
