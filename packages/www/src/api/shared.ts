import S from 'jsonschema-definer'

export const tSearch = {
  unicode: S.list(S.string()),
  categories: S.list(S.string()),
  description: S.object().additionalProperties(S.string()),
  tag: S.list(S.string()),
}

export const sSearch = S.shape(tSearch)

let searchObject: Record<string, typeof sSearch.type>

export async function getSearchObject(): Promise<typeof searchObject> {
  searchObject =
    searchObject ||
    (await import('../generated/search.json').then((r) => r.default))
  return searchObject
}
