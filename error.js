export class ConfigError extends Error {
  constructor(errorMessage) {
    super(errorMessage)
    this.name = "ConfigError"
  }
}
