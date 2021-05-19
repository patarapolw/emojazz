import yaml from 'js-yaml'
import { createRef } from 'preact'
import { useEffect, useState } from 'preact/hooks'

export function App() {
  const [content, setContent] = useState(
    [] as {
      text: string
      description: string
    }[],
  )
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

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
        `/api/q?q=${q.trimStart()}&page=${page}&limit=${limit}`,
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

  return (
    <>
      <form
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
                title={yaml.dump(c, {
                  replacer: (_, v) => {
                    if (!String(v)) {
                      return undefined
                    }
                    return v
                  },
                  skipInvalid: true,
                })}
              >
                {text}
              </div>
            ))
          ) : page === 1 ? (
            <div class="nothing">Nothing here 🤣🤣🤣</div>
          ) : null}
        </div>
      </div>
    </>
  )
}
