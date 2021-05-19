import fs from 'fs'

import yaml from 'js-yaml'
import S from 'jsonschema-definer'

import { makeSearch } from '../src/shared'
import { sSearch } from './shared'

async function main() {
  const searchObject = S.object()
    .additionalProperties(sSearch)
    .ensure(yaml.load(fs.readFileSync('assets/search.yaml', 'utf-8')) as any)

  const idx = makeSearch()

  Object.entries(searchObject).map(([text, r]) => {
    const obj = {
      text,
      description: [
        r.unicode.replace(/U\+/gi, ''),
        ...Object.values(r.description),
      ].join('\n'),
    }

    idx.add(obj)
  })

  fs.writeFileSync('assets/idx.txt', idx.export())

  // console.log(await idx.search('smil'))
  // console.log(idx.where({ description: 'smil' }))
}

if (require.main === module) {
  main()
}
