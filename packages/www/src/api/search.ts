import MiniSearch, { Options } from 'minisearch'

import { getSearchObject, sSearch } from './shared'

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
    // prefix: (_, i, terms) => i === terms.length - 1,
    combineWith: 'AND',
  },
}

let idx: MiniSearch<{
  id: string
  u: string[]
  c: string[]
  d: string
  t: string[]
}>

export async function search(inp: {
  q: string
  page: number
  limit: number
}): Promise<{
  result: (typeof sSearch.type & { text: string })[]
  count: number
}> {
  let { q = '' } = inp
  q = q.trimLeft()

  if (!q) {
    return {
      result: [],
      count: 0,
    }
  }

  const searchObject = await getSearchObject()

  if (typeof idx === 'undefined') {
    idx = new MiniSearch(idxOpts)
    await idx.addAllAsync(
      Object.entries(searchObject).map(([text, r]) => {
        return {
          id: text,
          u: r.unicode,
          c: r.categories,
          d: Object.values(r.description).join('\n'),
          t: r.tag,
        }
      }),
    )
  }

  const { page = 1, limit = 50 } = inp
  const rs = idx.search(q)

  return {
    result: rs
      .map((r) => ({
        text: r.id,
        ...searchObject[r.id],
      }))
      .slice((page - 1) * limit, page * limit),
    count: rs.length,
  }
}
