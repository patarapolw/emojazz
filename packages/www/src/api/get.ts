import yaml from 'js-yaml'
import S from 'jsonschema-definer'

import { getSearchObject, sSearch } from './shared'

let imageObject: Record<string, string[]>

export async function loadImageIndex() {
  if (typeof imageObject === 'undefined') {
    imageObject = S.object()
      .additionalProperties(S.list(S.string()))
      .ensure(yaml.load(await window.goLoadImage()) as any)
  }
}

export async function get(inp: { id: string }): Promise<
  | (typeof sSearch.type & {
      images: string[]
    })
  | null
> {
  const searchObject = await getSearchObject()
  const out = searchObject[inp.id]

  if (!out) {
    return null
  }

  await loadImageIndex()

  return {
    ...out,
    images: imageObject[inp.id] || [],
  }
}
