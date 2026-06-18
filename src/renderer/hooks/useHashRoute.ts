import { useState, useEffect, useCallback } from 'react'

export type Page = 'files' | 'photos' | 'videos' | 'shares' | 'admin'

function getPageFromHash(): Page {
  const hash = window.location.hash.replace('#/', '')
  const validPages: Page[] = ['files', 'photos', 'videos', 'shares', 'admin']
  return validPages.includes(hash as Page) ? (hash as Page) : 'files'
}

export function useHashRoute() {
  const [page, setPage] = useState<Page>(getPageFromHash)

  useEffect(() => {
    const handler = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = useCallback((p: Page) => {
    window.location.hash = `#/${p}`
  }, [])

  return { page, navigate }
}
