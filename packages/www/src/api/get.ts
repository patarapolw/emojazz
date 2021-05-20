import yaml from 'js-yaml'
import S from 'jsonschema-definer'

import { getSearchObject, sSearch } from './shared'

let imageObject: Record<string, string[]>

export async function get(inp: { id: string }): Promise<
  | (typeof sSearch.type & {
      images: string[]
    })
  | null
> {
  const searchObject = await getSearchObject()
  const out = searchObject[inp.id]

  console.log(searchObject, inp)

  if (!out) {
    return null
  }

  imageObject =
    imageObject ||
    S.object()
      .additionalProperties(S.list(S.string()))
      .ensure(yaml.load(await window.goLoadImage()) as any)

  return {
    ...out,
    images: imageObject[inp.id] || [],
  }
}
