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
    (await import('../generated/image.json').then((r) => r.default))

  return {
    ...out,
    images: imageObject[inp.id] || [],
  }
}
