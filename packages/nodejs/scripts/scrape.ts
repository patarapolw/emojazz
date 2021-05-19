import fs from 'fs'

import axios from 'axios'
import cheerio from 'cheerio'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'
import sanitize from 'sanitize-filename'

import { sSearch } from './shared'

async function doScrape(url: string) {
  const $ = cheerio.load(await axios.get(url).then((r) => r.data))

  const searchObject = fs.existsSync('assets/search.yaml')
    ? S.object()
        .additionalProperties(sSearch)
        .ensure(
          yaml.load(fs.readFileSync('assets/search.yaml', 'utf-8')) as any,
        )
    : {}
  const imageObject = fs.existsSync('assets/image.yaml')
    ? S.object()
        .additionalProperties(S.list(S.string()))
        .ensure(yaml.load(fs.readFileSync('assets/image.yaml', 'utf-8')) as any)
    : {}

  $('table').each((_, t) => {
    const $t = $(t)

    let bighead = ''
    let mediumhead = ''
    let header: string[] = []

    $t.find('tr').each((_, tr) => {
      const $tr = $(tr)

      bighead = $tr.find('.bighead').text().trim() || bighead
      mediumhead = $tr.find('.mediumhead').text().trim() || mediumhead

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

                const imgs = imageObject[text] || []
                imgs.push(filename)
                imageObject[text] = imgs
              } else {
                console.log(imgSrc)

                const imgSeg = imgSrc.split('/')

                const filename = sanitize(imgSeg[imgSeg.length - 1])
                axios.get(imgSrc).then((r) => {
                  const data = r.data
                  if (data instanceof Buffer) {
                    fs.writeFileSync(`assets/img/${filename}`, data)

                    const imgs = imageObject[text] || []
                    imgs.push(filename)
                    imageObject[text] = imgs
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

  Object.entries(imageObject).map(([k, v]) => {
    imageObject[k] = Array.from(new Set(v))
  })

  fs.writeFileSync('assets/search.yaml', yaml.dump(searchObject))
  fs.writeFileSync('assets/image.yaml', yaml.dump(imageObject))
}

if (require.main === module) {
  doScrape('https://www.unicode.org/emoji/charts/full-emoji-list.html').then(
    () =>
      doScrape(
        'https://www.unicode.org/emoji/charts/full-emoji-modifiers.html',
      ),
  )
}
