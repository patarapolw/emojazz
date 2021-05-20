import yaml from 'js-yaml'
import { createRef } from 'preact'
import { useEffect, useState } from 'preact/hooks'

export function App() {
  const [content, setContent] = useState(
    [] as {
      text: string
    }[],
  )
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState('')
  const [detail, setDetail] = useState({
    images: [] as string[],
  })
  const [font, setFont] = useState('Noto Color Emoji')
  const [f1, setF1] = useState(font)

  const rContainer = createRef<HTMLDivElement>()

  const limit = 100

  const doFetch = (
    opts: {
      prev?: any[]
    } = {},
  ) => {
    if (loading) {
      setTimeout(() => {
        doFetch(opts)
      }, 500)
      return
    }

    setLoading(true)
    ;(async () => {
      if (!q.trimStart()) {
        setPage(1)
        setContent([])
      }

      const r1 = await fetch(
        `/api/q?q=${encodeURIComponent(
          q.trimStart(),
        )}&page=${page}&limit=${limit}`,
      )
      if (!r1.ok) {
        setPage(1)
        setContent([])
      }

      const r2 = await r1.json()

      const c = [...(opts.prev || []), ...r2.result]
      setContent(c)
      setCount(r2.count)

      if (opts.prev) {
        const prevSet = new Set(opts.prev)
        const dupl = r2.result.filter((r: string) => prevSet.has(r))
        if (dupl.length) {
          console.error('Duplicates: ', dupl)
        }
      }
    })().finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    doFetch()
  }, [q])

  useEffect(() => {
    doFetch({ prev: content })
  }, [page])

  useEffect(() => {
    const el = rContainer.current
    if (el) {
      el.onscroll = () => {
        if (
          content.length < count &&
          el.scrollHeight - el.scrollTop - el.clientHeight < 50
        ) {
          setPage(page + 1)
        }
      }

      if (el.scrollHeight <= el.clientHeight) {
        el.scrollTop = 0
        setPage(1)
      }
    }
  }, [page, content])

  useEffect(() => {
    if (!selected) {
      return
    }

    fetch(`api/?id=${encodeURIComponent(selected)}`)
      .then((r) =>
        r.ok
          ? r.json()
          : {
              images: [],
            },
      )
      .then((r) => {
        setDetail(r)
      })
  }, [selected])

  useEffect(() => {
    window.onkeydown = (ev: KeyboardEvent) => {
      if (ev.code === 'Escape') {
        setSelected('')
      }
    }
  })

  return (
    <>
      <form
        className="search"
        onSubmit={async (e) => {
          e.preventDefault()
        }}
      >
        <input
          type="search"
          name="q"
          id="q"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        />
      </form>

      <div className="container">
        <div ref={rContainer}>
          {content.length ? (
            content.map(({ text, ...c }) => (
              <div
                className="emoji"
                title={cleanDump(c)}
                onClick={() => {
                  setF1(font)
                  setSelected(text)
                }}
              >
                {text}
              </div>
            ))
          ) : page === 1 ? (
            <div class="nothing">Nothing here 🤣🤣🤣</div>
          ) : null}
        </div>
      </div>

      {selected ? (
        <div className="modal-container" onClick={() => setSelected('')}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="delete"
              type="button"
              onClick={() => setSelected('')}
            >
              <div className="emoji">✕</div>
            </button>

            <div className="row" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: '1.3em' }}>Text:</span>
              <span className="entry" style={{ fontFamily: font }}>
                {selected}
              </span>
            </div>

            <div className="row">
              {detail.images.map((im) => (
                <div className="entry" title="Right click to copy the image">
                  <img src={im} alt={im} />
                </div>
              ))}
            </div>

            <form
              className="row font"
              onSubmit={async (e) => {
                e.preventDefault()
                setFont(f1)
              }}
              style={{ alignItems: 'center' }}
            >
              <label for="font" style={{ fontSize: '1.3em' }}>
                Font:
              </label>
              <input
                type="text"
                name="font"
                id="font"
                value={f1}
                onInput={(e) => setF1((e.target as HTMLInputElement).value)}
                placeholder="Set alternate font here"
              />
              <div style={{ position: 'relative' }}>
                <button type="submit">✅</button>
              </div>
            </form>

            <pre className="row" style={{ textAlign: 'left' }}>
              {(({ images, ...d }) => cleanDump(d))(detail)}
            </pre>
          </div>
        </div>
      ) : null}
    </>
  )
}

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
