import fs from 'fs'

import axios from 'axios'
import sqlite3 from 'better-sqlite3'
import cheerio from 'cheerio'
import sanitize from 'sanitize-filename'

async function main() {
  const sql = sqlite3('assets/emoji.db')

  sql.exec(/* sql */ `
  CREATE VIRTUAL TABLE IF NOT EXISTS q USING fts5(
    [text],
    [description],
    tokenize = 'porter unicode61'
  );

  CREATE TABLE IF NOT EXISTS q_image (
    [text]        TEXT NOT NULL,
    [filename]    TEXT NOT NULL,
    PRIMARY KEY ([text], [filename])
  );
  `)

  const $ = cheerio.load(
    await axios
      .get('https://www.unicode.org/emoji/charts/full-emoji-list.html')
      .then((r) => r.data),
  )

  const stmtAssociateFile = sql.prepare(/* sql */ `
  INSERT INTO q_image ([text], [filename])
  VALUES (@text, @filename)
  ON CONFLICT DO NOTHING
  `)
  const stmtRow = sql.prepare(/* sql */ `
  INSERT INTO q ([text], [description])
  SELECT @text, @description
  FROM q WHERE (SELECT 1 FROM q WHERE [text] = @text)
  `)

  sql.transaction(() => {
    $('table').each((_, t) => {
      const $t = $(t)

      let bighead = ''
      let mediumhead = ''
      let header: string[] = []

      $t.find('tr').each((_, tr) => {
        const $tr = $(tr)

        bighead = $tr.find('.bighead').text()
        mediumhead = $tr.find('.mediumhead').text()

        const $ths = $tr.find('th')
        const $tds = $tr.find('td')

        if ($ths.length > 10) {
          header = Array.from($ths).map((th) => $(th).text())
        }

        if ($tds.length > 10) {
          const unicode = $($tds[1]).text().trim()
          const text = $($tds[2]).text().trim()

          const description = [bighead, mediumhead]

          $tds.each((i, td) => {
            if (i > 0 && i !== 2) {
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
                  description.push(`${header[i]}: ${desc}`)
                }
              }
            }
          })

          console.log(text)

          const d = description
            .map((s) => s.trim())
            .filter((s) => s)
            .join('\n')

          console.log(d)

          console.log('\n')

          stmtRow.run({
            text,
            description: d,
          })
        }
      })
    })
  })()

  sql.close()
}

if (require.main === module) {
  main()
}
