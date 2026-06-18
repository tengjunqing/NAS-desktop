declare global {
  interface Window {
    electronAPI: {
      openDirectory: () => Promise<string[]>
      openFiles: () => Promise<string[]>
      saveFile: (defaultPath: string) => Promise<string | undefined>
      openExternal: (url: string) => Promise<void>
      getVersion: () => Promise<string>
    }
  }
}

export {}