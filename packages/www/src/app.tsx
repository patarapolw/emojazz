import { useEffect, useState } from 'preact/hooks'

export function App() {
  const [contents, updateContents] = useState([] as string[])
  const [q, updateQ] = useState('')
  const [loading, updateLoading] = useState(false)

  const setP = () => {
    if (loading) {
      setTimeout(() => {
        setP()
      }, 500)
      return
    }

    updateLoading(true)

    ;(async () => {
      if (!q.trim()) {
        updateContents([])
      }

      const r1 = await fetch(`/api/q?q=${q}&limit=100`)
      if (!r1.ok) {
        updateContents([])
      }

      const r2 = await r1.json()
      updateContents(r2.result)
    })().finally(() => updateLoading(false))
  }

  useEffect(() => {
    setP()
  }, [q])

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
          onInput={(e) => updateQ((e.target as HTMLInputElement).value)}
        />
      </form>

      <div className="container">
        {contents.length ? (
          contents.map((c) => <div className="emoji">{c}</div>)
        ) : (
          <div class="nothing">Nothing here 🤣🤣🤣</div>
        )}
      </div>
    </>
  )
}
