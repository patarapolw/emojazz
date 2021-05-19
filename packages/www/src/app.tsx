export function App() {
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <input type="search" name="q" id="q" />
        <button type="submit">
          <span className="emoji">🔍</span>
        </button>
      </form>
    </>
  )
}
