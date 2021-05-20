import fs from 'fs-extra'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'
import MiniSearch from 'minisearch'

import { idxOpts, sSearch } from '../src/shared'

async function main() {
  fs.copySync('assets/img', '../www/public/img')

  const searchObject = S.object()
    .additionalProperties(sSearch)
    .ensure(yaml.load(fs.readFileSync('assets/search.yaml', 'utf-8')) as any)

  const idx = new MiniSearch(idxOpts)
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

  fs.writeFileSync('../www/src/generated/idx.json', JSON.stringify(idx))
  fs.writeFileSync(
    '../www/src/generated/search.json',
    JSON.stringify(searchObject),
  )

  const imageObject = S.object()
    .additionalProperties(S.list(S.string()))
    .ensure(yaml.load(fs.readFileSync('assets/image.yaml', 'utf-8')) as any)

  fs.writeFileSync(
    '../www/src/generated/image.json',
    JSON.stringify(imageObject),
  )
}

if (require.main === module) {
  main()
}
