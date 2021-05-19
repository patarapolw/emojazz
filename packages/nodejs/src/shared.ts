import FlexSearch from 'flexsearch'

export function makeSearch() {
  return FlexSearch.create<{
    text: string
    description: string
  }>({
    doc: {
      id: 'text',
      field: {
        text: {
          encode: false,
          tokenize: false,
        },
        description: {},
      },
    },
  })
}
