import fs from 'fs'

import axios from 'axios'
import sqlite3 from 'better-sqlite3'
import cheerio from 'cheerio'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'
import sanitize from 'sanitize-filename'

import { sSearch } from './shared'

async function main() {
  const sql = sqlite3('assets/search.db')

  sql.exec(/* sql */ `
  CREATE TABLE IF NOT EXISTS [image] (
    [text]        TEXT NOT NULL,
    [filename]    TEXT NOT NULL,
    PRIMARY KEY ([text], [filename])
  );
  `)

  const $ = cheerio.load(
    await axios
      // .get('https://www.unicode.org/emoji/charts/full-emoji-list.html')
      .get('https://www.unicode.org/emoji/charts/full-emoji-modifiers.html')
      .then((r) => r.data),
  )

  const stmtAssociateFile = sql.prepare(/* sql */ `
  INSERT INTO image ([text], [filename])
  VALUES (@text, @filename)
  ON CONFLICT DO NOTHING
  `)

  const searchObject = fs.existsSync('assets/search.yaml')
    ? S.object()
        .additionalProperties(sSearch)
        .ensure(
          yaml.load(fs.readFileSync('assets/search.yaml', 'utf-8')) as any,
        )
    : {}

  sql.transaction(() => {
    $('table').each((_, t) => {
      const $t = $(t)

      let bighead = ''
      let mediumhead = ''
      let header: string[] = []

      $t.find('tr').each((_, tr) => {
        const $tr = $(tr)

        bighead = bighead || $tr.find('.bighead').text().trim()
        mediumhead = mediumhead || $tr.find('.mediumhead').text().trim()

        const $ths = $tr.find('th')
        const $tds = $tr.find('td')

        if ($ths.length > 10) {
          header = Array.from($ths).map((th) => $(th).text())
        }

        if ($tds.length > 10) {
          const unicode = $($tds[1]).text().trim()
          const text = $($tds[2]).text().trim()

          const description: Record<string, string> = {
            main: bighead,
            sub: mediumhead,
          }

          $tds.each((i, td) => {
            if (i > 2) {
              const $td = $(td)
              const imgSrc = $td.find('img').attr('src')

              if (imgSrc) {
                if (imgSrc.startsWith('data:image')) {
                  const ext = imgSrc.split('/')[1].split(';')[0]
                  const filename = sanitize(`${unicode}-${header[i]}.${ext}`)
                  const data = Buffer.from(imgSrc.split(',')[1], 'base64')

                  fs.writeFileSync(`assets/img/${filename}`, data)
                  stmtAssociateFile.run({ text, filename })
                } else {
                  console.log(imgSrc)

                  const imgSeg = imgSrc.split('/')

                  const filename = sanitize(imgSeg[imgSeg.length - 1])
                  axios.get(imgSrc).then((r) => {
                    const data = r.data
                    if (data instanceof Buffer) {
                      fs.writeFileSync(`assets/img/${filename}`, data)
                      stmtAssociateFile.run({ text, filename })
                    } else {
                      console.error(`Cannot write: ${imgSrc}`)
                    }
                  })
                }
              } else {
                const desc = $td.text()

                if (/[A-Z0-9]/i.test(desc)) {
                  description[header[i]] = desc
                }
              }
            }
          })

          if (!searchObject[text]) {
            searchObject[text] = {
              unicode,
              description,
            }
          } else {
            searchObject[text] = {
              unicode,
              description: {
                ...searchObject[text].description,
                ...description,
              },
            }
          }
        }
      })
    })
  })()

  sql.close()

  fs.writeFileSync('assets/search.yaml', yaml.dump(searchObject))
}

if (require.main === module) {
  main()
}
