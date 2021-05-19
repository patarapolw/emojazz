import { useEffect, useState } from 'preact/hooks'

export function App() {
  const [contents, setContent] = useState(
    [] as {
      text: string
      description: string
    }[],
  )
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const limit = 40

  const setP = () => {
    if (loading) {
      setTimeout(() => {
        setP()
      }, 500)
      return
    }

    setLoading(true)
    ;(async () => {
      if (!q.trim()) {
        setPage(1)
        setContent([])
      }

      const r1 = await fetch(`/api/q?q=${q}&page=${page}&limit=${limit}`)
      if (!r1.ok) {
        setPage(1)
        setContent([])
      }

      const r2 = await r1.json()

      const c = r2.result
      setContent(c)
      setCount(r2.count)

      if (!c.length) {
        setPage(1)
      }
    })().finally(() => setLoading(false))
  }

  useEffect(() => {
    setP()
  }, [q, page])

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
        <div>
          {contents.length ? (
            contents.map((c) => (
              <div className="emoji" title={c.description}>
                {c.text}
              </div>
            ))
          ) : page === 1 ? (
            <div class="nothing">Nothing here 🤣🤣🤣</div>
          ) : null}
        </div>
      </div>

      {count > limit ? (
        <ul className="pagination">
          <li style={{ visibility: page > 1 ? 'visible' : 'hidden' }}>
            <button type="button" onClick={() => setPage(page - 1)}>
              🢐
            </button>
          </li>
          <li>
            {page} / {Math.ceil(count / limit)}
          </li>
          <li
            style={{
              visibility:
                page < Math.ceil(count / limit) ? 'visible' : 'hidden',
            }}
          >
            <button type="button" onClick={() => setPage(page + 1)}>
              🢒
            </button>
          </li>
        </ul>
      ) : null}
    </>
  )
}
