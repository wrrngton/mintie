export class GenerateResponse {
  constructor(instance, docs, facets) {
    this.docs = docs;
    this.facets = facets;
    this.attributesToRetrieve = instance.config.attributesToRetrieve;
    this.limitResponseFields();
    return this.buildResponse();
  }

  limitResponseFields() {
    this.docs = this.docs.map((doc) => {
      return Object.fromEntries(
        Object.entries(doc).filter(([key]) =>
          this.attributesToRetrieve.includes(key),
        ),
      );
    });
  }

  buildResponse() {
    return {
      hits: this.docs,
      facets: this.facets,
    };
  }
}
