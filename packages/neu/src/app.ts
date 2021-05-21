import yaml from 'js-yaml'
import S from 'jsonschema-definer'

import { get, loadBaseURL } from './api/get'
import { loadIndex, search } from './api/search'
import { State } from './util'

const elStyleEmoji = S.instanceOf(HTMLStyleElement).ensure(
  document.getElementById('emoji-font') as HTMLStyleElement,
)
const elQ = S.instanceOf(HTMLInputElement).ensure(
  document.getElementById('q') as HTMLInputElement,
)
const elEmojiContainer = S.instanceOf(HTMLDivElement).ensure(
  document.getElementById('emoji-container') as HTMLDivElement,
)
const elNothing = S.instanceOf(HTMLDivElement).ensure(
  document.getElementById('nothing') as HTMLDivElement,
)
const elNotReady = S.instanceOf(HTMLDivElement).ensure(
  document.getElementById('not-ready') as HTMLDivElement,
)
const elIsSelected = S.instanceOf(HTMLDivElement).ensure(
  document.getElementById('is-selected') as HTMLDivElement,
)
const elIsSelectedCloseButton = S.instanceOf(HTMLButtonElement).ensure(
  document.querySelector('#is-selected .close-button') as HTMLButtonElement,
)
const elIsSelectedEntry = S.instanceOf(HTMLSpanElement).ensure(
  elIsSelected.querySelector('#entry') as HTMLSpanElement,
)
const elIsSelectedImageContainer = S.instanceOf(HTMLDivElement).ensure(
  elIsSelected.querySelector('#image-container') as HTMLDivElement,
)
const elIsSelectedPre = S.instanceOf(HTMLPreElement).ensure(
  elIsSelected.querySelector('pre') as HTMLPreElement,
)
const elIsSelectedFontForm = S.instanceOf(HTMLFormElement).ensure(
  elIsSelected.querySelector('form') as HTMLFormElement,
)
const elIsSelectedFontFormInput = S.instanceOf(HTMLInputElement).ensure(
  elIsSelectedFontForm.querySelector('input') as HTMLInputElement,
)

const page = new State(1)
const selected = new State('')
const detail = new State({
  images: [] as string[],
})
const content = new State(
  [] as {
    text: string
  }[],
)
const isReady = new State(false)
const isLoading = new State(false)
const font = new State('Noto Color Emoji')

let count = 0

const limit = 100

const doFetch = (
  opts: {
    prev?: any[]
  } = {},
) => {
  if (isLoading.current) {
    setTimeout(() => {
      doFetch(opts)
    }, 500)
    return
  }

  isLoading.set(true)
  ;(async () => {
    const q = elQ.value

    if (!q.trimStart()) {
      page.set(1)
      content.set([])
    }

    const r = await search({
      q,
      page: page.current,
      limit,
    })

    if (!r.count) {
      page.set(1)
      content.set([])
    }

    const c = [...(opts.prev || []), ...r.result]
    content.set(c)
    count = r.count

    if (opts.prev) {
      const prevSet = new Set(opts.prev)
      const dupl = r.result.filter((r0) => prevSet.has(r0.text))
      if (dupl.length) {
        console.error('Duplicates: ', dupl)
      }
    }
  })().finally(() => {
    isLoading.set(false)
  })
}

elQ.addEventListener('input', () => {
  doFetch()
})
elEmojiContainer.addEventListener('scroll', () => {
  if (
    content.current.length < count &&
    elEmojiContainer.scrollHeight -
      elEmojiContainer.scrollTop -
      elEmojiContainer.clientHeight <
      50
  ) {
    page.set(page.current + 1)
    doFetch({ prev: content.current })
  } else if (elEmojiContainer.scrollHeight <= elEmojiContainer.clientHeight) {
    elEmojiContainer.scrollTop = 0
    page.set(1)
  }
})

Promise.all([loadBaseURL(), loadIndex()]).then(() => {
  isReady.set(true)
})

window.onkeydown = (ev: KeyboardEvent) => {
  if (ev.code === 'Escape') {
    selected.set('')
  }
}

selected.subscribe((current) => {
  if (!current) {
    return
  }

  get({
    id: current,
  }).then((r) => {
    detail.set(
      r || {
        images: [],
      },
    )
  })
})

content.subscribe((rs) => {
  elNothing.style.display = rs.length ? 'none' : 'block'
  elEmojiContainer.querySelectorAll('.emoji').forEach((el) => el.remove())

  rs.map(({ text, ...other }) => {
    const elEmoji = Object.assign(document.createElement('div'), {
      className: 'emoji',
      innerText: text,
      title: cleanDump(other),
    })

    elEmoji.onclick = () => {
      selected.set(text)
    }

    elEmojiContainer.append(elEmoji)
  })
})

isReady.subscribe((r) => {
  elNotReady.style.display = r ? 'none' : 'block'
})

selected.subscribe((r) => {
  elIsSelected.style.display = r ? 'flex' : 'none'
  elIsSelectedEntry.innerText = r
})

detail.subscribe(({ images, ...other }) => {
  elIsSelectedImageContainer.textContent = ''
  images.map((im) => {
    elIsSelectedImageContainer.innerHTML += /* html */ `
    <div class="entry" title="Right click to copy the image">
      <img src="${im}" alt="${selected}" />
    </div>
    `
  })

  elIsSelectedPre.innerText = cleanDump(other)
})

elIsSelected.onclick = () => {
  selected.set('')
}

elIsSelectedCloseButton.onclick = () => {
  selected.set('')
}

elIsSelectedFontForm.onsubmit = (ev) => {
  ev.preventDefault()
  font.set(elIsSelectedFontFormInput.value.replace(/[A-Z0-9 ]/gi, ' '))
}

font.subscribe((r) => {
  elStyleEmoji.innerHTML = /* css */ `
  .emoji {
    font-family: '${r}';
  }
  `
})

function cleanDump(c: any) {
  return yaml.dump(c, {
    replacer: (_, v) => {
      if (!String(v)) {
        return undefined
      }
      return v
    },
    skipInvalid: true,
  })
}
