import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Files from './pages/Files'
import Photos from './pages/Photos'
import Videos from './pages/Videos'
import Shares from './pages/Shares'
import Admin from './pages/Admin'
import { getToken, getMe, clearAuth } from './api'

type Page = 'files' | 'photos' | 'videos' | 'shares' | 'admin'

function App() {
  const [token, setToken] = useState<string | null>(getToken())
  const [user, setUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState<Page>('files')
  const [selectedVolume, setSelectedVolume] = useState('default')
  const [selectedPath, setSelectedPath] = useState('')

  useEffect(() => {
    if (token) {
      getMe()
        .then(data => setUser(data))
        .catch(() => {
          clearAuth()
          setToken(null)
        })
    }
  }, [token])

  const handleLogin = (newToken: string) => {
    setToken(newToken)
  }

  const handleLogout = () => {
    clearAuth()
    setToken(null)
    setUser(null)
  }

  const handleNavigate = (page: Page) => {
    setCurrentPage(page)
    if (page === 'files') {
      setSelectedPath('')
    }
  }

  if (!token || !user) {
    return <Login onLogin={handleLogin} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'files':
        return (
          <Files
            volume={selectedVolume}
            path={selectedPath}
            onNavigate={(vol, p) => {
              setSelectedVolume(vol)
              setSelectedPath(p)
            }}
          />
        )
      case 'photos':
        return <Photos />
      case 'videos':
        return <Videos />
      case 'shares':
        return <Shares />
      case 'admin':
        return <Admin user={user} />
      default:
        return <Files volume={selectedVolume} path={selectedPath} onNavigate={() => {}} />
    }
  }

  return (
    <div className="app-layout">
      <div className="titlebar-drag" />
      <Sidebar
        user={user}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}

export default App