declare global {
  interface Window {
    NL_PATH: string
    NL_CWD: string
    NL_OS: 'Windows' | 'Linux' | 'macOS'
    NL_BASE_URL: string

    Neutralino: {
      filesystem: {
        readFile(inp: { filename: string }): Promise<{
          data: string
        }>
      }
    }
  }
}

export const { Neutralino } = window
