function filterParser(filters) {
  console.log(filters);
}


export function filtering(instance, rankedDocs) {
  /* If no documents are passed to the method, it means this is a request without a query term
   * and we filter directly on the rawDocStore
   */

  if(instance.payload === null) return rankedDocs;

  if (rankedDocs == null) {
    return ;
  }
  const filters = filterParser(instance.payload.filters);

}
