import yaml from 'js-yaml'
import S from 'jsonschema-definer'

declare global {
  interface Window {
    goLoadSearch: () => Promise<{
      result: string
    }>
    goLoadImage: () => Promise<{
      result: string
      base?: string
    }>
  }
}
declare const __LoadSearch__: string
declare const __LoadImage__: string

window.goLoadSearch =
  window.goLoadSearch ||
  (() => ({
    result: __LoadSearch__,
  }))
window.goLoadImage =
  window.goLoadImage ||
  (() => ({
    result: __LoadImage__,
  }))

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
    S.object()
      .additionalProperties(sSearch)
      .ensure(
        yaml.load(await window.goLoadSearch().then((r) => r.result)) as any,
      )
  return searchObject
}
