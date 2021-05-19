import fs from 'fs'

import sqlite3 from 'better-sqlite3'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'

import { sSearch } from './shared'

async function main() {
  const searchArray = S.list(sSearch).ensure(
    yaml.load(fs.readFileSync('assets/search.yaml', 'utf-8')) as any,
  )

  const sql = sqlite3('assets/search.db')

  sql.exec(/* sql */ `
  CREATE VIRTUAL TABLE IF NOT EXISTS q USING fts5(
    [text],
    [description],
    tokenize = 'porter trigram'
  );
  `)

  const stmtRow = sql.prepare(/* sql */ `
  INSERT INTO q ([text], [description])
  SELECT @text, @description
  WHERE NOT EXISTS (SELECT 1 FROM q WHERE [text] = @text)
  `)

  sql.transaction(() => {
    searchArray.map((r) => {
      stmtRow.run({
        text: r.text,
        description: [
          r.unicode.replace(/U\+/gi, ''),
          ...Object.values(r.description),
        ].join('\n'),
      })
    })
  })()

  sql.close()
}

if (require.main === module) {
  main()
}
