import S from 'jsonschema-definer'
import { Options } from 'minisearch'

export const tSearch = {
  unicode: S.list(S.string()),
  categories: S.list(S.string()),
  description: S.object().additionalProperties(S.string()),
  tag: S.list(S.string()),
}

export const sSearch = S.shape(tSearch)

export const idxOpts: Options<{
  id: string
  u: string[]
  c: string[]
  d: string
  t: string[]
}> = {
  fields: ['id', 'u', 'c', 'd', 't'],
  storeFields: ['id'],
  searchOptions: {
    boost: {
      t: 5,
      c: 2,
    },
    prefix: true,
  },
}
