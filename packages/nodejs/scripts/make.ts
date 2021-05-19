import fs from 'fs'

import sqlite3 from 'better-sqlite3'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'

import { sSearch } from './shared'

async function main() {
  const searchObject = S.object()
    .additionalProperties(sSearch)
    .ensure(yaml.load(fs.readFileSync('assets/search.yaml', 'utf-8')) as any)

  const sql = sqlite3('assets/search.db')

  sql.exec(/* sql */ `
  CREATE VIRTUAL TABLE IF NOT EXISTS q USING fts5(
    [text],
    [description],
    tokenize = 'porter trigram'
  );
  `)

  const stmtInsert = sql.prepare(/* sql */ `
  INSERT INTO q ([text], [description])
  SELECT @text, @description
  `)

  const stmtUpdate = sql.prepare(/* sql */ `
  UPDATE q
  SET [description] = @description
  WHERE [text] = @text
  `)

  sql.transaction(() => {
    Object.entries(searchObject).map(([text, r]) => {
      const obj = {
        text,
        description: [
          r.unicode.replace(/U\+/gi, ''),
          ...Object.values(r.description),
        ].join('\n'),
      }

      const { changes } = stmtUpdate.run(obj)

      if (!changes) {
        stmtInsert.run(obj)
      }
    })
  })()

  sql.close()
}

if (require.main === module) {
  main()
}
